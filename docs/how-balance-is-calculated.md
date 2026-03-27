# How Balance Is Calculated

This guide explains, in plain language, how the payment ledger computes a member's balance.

It is written to be used as context for tutorials, onboarding, and video explanations. The goal is to make the balance feel understandable and predictable, not mysterious.

## Core Idea

The ledger does not assign balances randomly.

A member's balance is always based on two running numbers:

1. How much the member should have paid by now
2. How much the member has actually paid so far

The balance is simply the difference between those two numbers.

## The Main Formula

At a high level:

`Balance = Total Paid - Total Expected By Now`

This means:

- If the result is `0`, the member is exactly up to date.
- If the result is positive, the member has paid ahead.
- If the result is negative, the member still has an unpaid amount.

## What "Total Expected By Now" Means

The ledger first determines how much a member should have paid as of today.

That number is based on:

1. The ledger start date
2. The daily payment amount
3. The active class days in the weekly schedule
4. Any calendar overrides such as holidays or no-class days

This is the foundation of the whole system.

## Step 1: Start From the Ledger Start Date

Each ledger has a start date.

That date tells the system when the running balance should begin.

Any day before the start date is ignored.

Example:

- Start date: June 3
- If today is June 30
- Only days from June 3 onward are considered

## Step 2: Check the Weekly Schedule

Each ledger also has a weekly schedule.

This schedule tells the system which weekdays count as normal payment days.

Example:

- Monday to Friday are active
- Saturday and Sunday are not active

If a day is not part of the active weekly schedule, it does not increase what a member is expected to have paid.

## Step 3: Apply Calendar Overrides

The ledger can mark specific dates as special dates, such as:

- Holiday
- No class

These dates are removed from the payable schedule even if they normally fall on an active weekday.

This matters because members should not be charged for days that were intentionally excluded.

Example:

- Monday to Friday are active
- Friday, June 14 is marked as a holiday
- That Friday does not count toward the expected total

## Step 4: Count the Valid Payable Days

After applying the weekly schedule and calendar overrides, the system counts the remaining valid class days from the start date up to today.

These are the days that actually matter for balance calculation.

You can think of them as:

`Valid Payable Days = Scheduled Days - Excluded Override Days`

## Step 5: Multiply by the Daily Amount

Once the ledger knows how many valid payable days have happened so far, it multiplies that by the fixed daily payment amount.

Formula:

`Expected By Now = Valid Payable Days x Daily Payment Amount`

Example:

- Daily payment: `P10`
- Valid payable days so far: `24`
- Expected by now: `P240`

This is the amount the member should have paid if they were fully up to date.

## What "Total Paid" Means

The second major number is the total amount the member has actually paid.

This is the running sum of all valid payments recorded for that member.

In normal terms:

- Every payment that is recorded increases the member's total paid amount
- If a payment is voided, it no longer counts
- The ledger looks at the current valid payment total, not just the latest transaction

Example:

- Payment 1: `P50`
- Payment 2: `P100`
- Payment 3: `P40`
- Total paid: `P190`

## Final Balance Computation

Once both numbers are known, the ledger compares them.

Formula:

`Balance = Total Paid - Expected By Now`

Example 1:

- Expected by now: `P240`
- Total paid: `P240`
- Balance: `P0`

Interpretation:

- The member is exactly on schedule

Example 2:

- Expected by now: `P240`
- Total paid: `P270`
- Balance: `P30`

Interpretation:

- The member has paid ahead by `P30`

Example 3:

- Expected by now: `P240`
- Total paid: `P180`
- Balance: `-P60`

Interpretation:

- The member is short by `P60`

## How Status Is Determined

The system also derives a simple status from the balance situation.

The current status categories are:

- `Paid`
- `Partial`
- `Unpaid`

These are decided from the member's total paid amount compared with the expected total.

### Paid

A member is marked as `Paid` when:

`Total Paid >= Expected By Now`

This means they are fully covered for all currently expected days.

They may be exactly on time or may have paid ahead.

### Partial

A member is marked as `Partial` when:

- They have paid something
- But their total paid is still below the expected total

This means they are not fully covered yet, but they have made at least some payment.

### Unpaid

A member is marked as `Unpaid` when:

- Their total paid is `0`
- And there is already an expected total

This means no amount has been paid toward the days that are already due.

## Why the Balance Changes Over Time

The balance is not a fixed value.

It changes whenever the expected amount or the paid amount changes.

### The Balance Increases When

- A new payment is recorded
- A previously missing payment is added
- A member pays more than the currently due amount

### The Balance Decreases When

- More valid class days pass
- A payment is voided
- The daily amount is increased
- The schedule or start date changes in a way that increases the expected total

## Why a Member Can Become More Negative Without New Transactions

This is one of the most important ideas to explain in a tutorial.

A member's balance can go down even if no one edits their transactions.

That happens because the expected total keeps growing as more valid class days happen.

Example:

- Monday: expected total is `P200`, member paid `P200`, balance is `P0`
- Tuesday is another valid class day with a `P10` daily rate
- Expected total becomes `P210`
- If no new payment is added, balance becomes `-P10`

This is normal and expected behavior.

The system is always comparing payments against the latest amount that should have been paid by today.

## How the Calendar Relates to the Balance

The calendar is a visual explanation of the same rules used for the balance.

It is not a separate system.

It reflects the same logic underneath.

### Green Days

Green days are days that are already covered by the member's total payments.

### Red Days

Red days are valid payable days that are not yet covered by the member's current payment total.

### No-Class or Holiday Days

These are excluded days.

They do not add to the expected total and should not make a member appear behind.

## How Payment Coverage Is Interpreted on the Calendar

The calendar treats the member's total paid amount as coverage for valid class days in sequence, starting from the earliest payable day.

This means the system does not try to guess the user's intent day by day.

Instead, it uses a consistent rule:

1. Count all valid class days from the start date
2. Determine how many full daily payments the member's total paid amount covers
3. Mark that number of earliest valid days as covered
4. Leave the remaining valid days uncovered

Example:

- Daily rate: `P10`
- Total paid: `P70`
- Covered days: `7`

If there have been 10 valid class days so far:

- First 7 valid days appear covered
- Remaining 3 valid days appear unpaid

This makes the calendar easy to read and consistent for everyone.

## What Happens If the Member Pays More Than Expected

If the member pays more than what is currently expected:

- Their balance becomes positive
- Their extra payment is treated as advance coverage
- Future valid class days will gradually consume that positive balance

Example:

- Expected by now: `P240`
- Total paid: `P300`
- Balance: `P60`

If the daily rate is `P10`, that means the member is effectively 6 payable days ahead.

As future valid days pass, the advance balance will decrease until it returns to zero, unless they continue paying ahead.

## What Happens If the Daily Rate Changes

If the daily payment amount changes, the expected total changes too.

That matters because the system uses the daily rate when calculating:

- The running expected total
- How much each valid day is worth
- How many days a member's total payments can cover

This means a daily rate change may shift balances significantly.

## What Happens If the Start Date Changes

The start date is one of the strongest factors in the calculation.

Changing it affects how many payable days are counted.

If the start date is moved earlier:

- More days may become payable
- Expected totals may increase
- Balances may become lower or more negative

If the start date is moved later:

- Fewer days may be counted
- Expected totals may drop
- Balances may become higher or less negative

## What Happens If the Weekly Schedule Changes

The weekly schedule defines which weekdays count.

If the schedule changes:

- Some dates may start counting
- Some dates may stop counting
- Expected totals can increase or decrease

This directly affects every member because the expected amount depends on the total number of valid class days.

## What Happens If Holidays or No-Class Days Are Added or Removed

Overrides affect the expected total immediately.

If a no-class day is added:

- That date is removed from the payable count
- Expected totals may drop
- Balances may improve

If a no-class day is removed:

- That date becomes payable again if it matches the schedule
- Expected totals may rise
- Balances may drop

## Why Two Members Can Have Very Different Balances

Even under the same class settings, members can have different balances because:

- Their total paid amounts are different
- Some may be ahead
- Some may be partially paid
- Some may have no payments yet

The expected total is shared by the class rules, but the paid total is personal to each member.

## Why the Ledger Also Shows Class-Level Totals

In addition to per-member balances, the public page may also show class-wide totals such as:

- Total collected
- Expected total
- Goal amount

These are summary numbers for the whole ledger.

They help members understand the overall collection progress, but they do not replace the personal balance formula.

Each member's own balance still comes from:

`Their Total Paid - Their Expected Amount By Now`

## The Most Important Message for Members

If you want one short explanation for members, it is this:

"Your balance is based on how much you have already paid compared with how much you should have paid by today, using the daily rate and only the valid class days."

## Suggested Tutorial Structure

If this is being turned into a video, this order works well:

1. Explain that the app is not guessing or assigning random balances
2. Introduce the two numbers: total paid and expected by now
3. Explain how active class days are counted
4. Explain how holidays and no-class days are excluded
5. Show the main formula
6. Walk through one example of on-time, ahead, and behind
7. Show how the calendar matches the balance
8. Explain why balances can change even without a new payment
9. Explain how advance payments work
10. End by reassuring members that the balance always follows the same rules

## Short Script-Friendly Summary

Here is a script-ready version:

"Your balance is calculated using a simple rule. First, the system counts how many valid class days have happened since the ledger started. Then it multiplies that by the daily payment amount to find how much you should have paid by now. After that, it compares that expected total with the payments that were actually recorded under your name. If you paid exactly the expected amount, your balance is zero. If you paid more, your balance is positive. If you paid less, your balance is negative. Holidays and no-class days do not count, so you are only charged for the real payable days in the ledger."
