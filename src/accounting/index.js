#!/usr/bin/env node
/*
  Node.js port of the simple COBOL account system.
  - Preserves business logic: read/write balance, credit, debit
  - Uses integer cents internally to preserve data integrity
  - Menu options mirror the original application

  Exports functions for later unit/integration tests.
*/

const readline = require('readline/promises');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// STORAGE-BALANCE equivalent (WORKING-STORAGE)
// Represented in integer cents to avoid floating point errors.
let STORAGE_BALANCE_CENTS = 1000_00; // 1000.00 -> 100000 cents

// Maximum supported by PIC 9(6)V99 -> 999999.99
const MAX_BALANCE_CENTS = 999_999_99; // 99999999 cents

function formatBalance(cents) {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  const integerPart = Math.floor(abs / 100).toString().padStart(6, '0');
  const decimals = (abs % 100).toString().padStart(2, '0');
  return `${sign}${integerPart}.${decimals}`;
}

function parseAmountToCents(input) {
  if (typeof input !== 'string' && typeof input !== 'number') return null;
  const s = String(input).trim().replace(',', '.');
  if (!/^[-+]?[0-9]+(\.[0-9]{1,})?$/.test(s)) return null;
  const sign = s.startsWith('-') ? -1 : 1;
  const abs = s.replace(/^[-+]/, '');
  const parts = abs.split('.');
  const whole = parts[0] || '0';
  const frac = (parts[1] || '').padEnd(2, '0').slice(0,2);
  const cents = sign * (parseInt(whole, 10) * 100 + parseInt(frac, 10));
  return Number.isNaN(cents) ? null : cents;
}

// DataProgram contract: read and write
function readBalance() {
  return STORAGE_BALANCE_CENTS;
}

function writeBalance(cents) {
  if (!Number.isInteger(cents)) throw new Error('Balance must be integer cents');
  if (cents < 0 || cents > MAX_BALANCE_CENTS) {
    throw new RangeError(`Balance out of allowed range (0..${MAX_BALANCE_CENTS / 100})`);
  }
  STORAGE_BALANCE_CENTS = cents;
}

function creditAccount(amountCents) {
  if (!Number.isInteger(amountCents) || amountCents <= 0) throw new Error('Credit amount must be positive integer cents');
  const newBalance = readBalance() + amountCents;
  if (newBalance > MAX_BALANCE_CENTS) throw new RangeError('Resulting balance exceeds maximum allowed');
  writeBalance(newBalance);
  return newBalance;
}

function debitAccount(amountCents) {
  if (!Number.isInteger(amountCents) || amountCents <= 0) throw new Error('Debit amount must be positive integer cents');
  const current = readBalance();
  if (amountCents > current) throw new RangeError('Insufficient funds');
  const newBalance = current - amountCents;
  writeBalance(newBalance);
  return newBalance;
}

async function mainMenu() {
  while (true) {
    console.log('--------------------------------');
    console.log('Account Management System');
    console.log('1. View Balance');
    console.log('2. Credit Account');
    console.log('3. Debit Account');
    console.log('4. Exit');
    console.log('--------------------------------');

    // ask for menu choice
    let sel = '';
    while (true) {
      const answer = await rl.question('Enter your choice (1-4): ');
      if (/^[1-4]$/.test(String(answer).trim())) { sel = String(answer).trim(); break; }
      console.log('Please enter a number between 1 and 4');
    }
    if (sel === '1') {
      console.log('Current balance: ' + formatBalance(readBalance()));
    } else if (sel === '2' || sel === '3') {
      const isCredit = sel === '2';
      // ask for amount and validate
      let cents = null;
      while (true) {
        const amount = await rl.question(`Enter amount to ${isCredit ? 'credit' : 'debit'} (e.g. 100.50): `);
        const c = parseAmountToCents(amount);
        if (c && c > 0) { cents = c; break; }
        console.log('Enter a positive decimal amount (e.g. 50.00)');
      }
      try {
        if (isCredit) {
          const nb = creditAccount(cents);
          console.log('Balance after credit: ' + formatBalance(nb));
        } else {
          const nb = debitAccount(cents);
          console.log('Balance after debit: ' + formatBalance(nb));
        }
      } catch (err) {
        console.log('Error: ' + err.message);
      }
    } else if (sel === '4') {
      console.log('Exiting the program. Goodbye!');
      await rl.close();
      process.exit(0);
    }
    console.log();
  }
}

// Allow running as script and importing for tests
if (require.main === module) {
  mainMenu().catch(err => {
    console.error('Fatal error:', err);
    process.exit(2);
  });
}

module.exports = {
  formatBalance,
  parseAmountToCents,
  readBalance,
  writeBalance,
  creditAccount,
  debitAccount,
};
