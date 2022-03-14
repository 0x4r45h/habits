import { u128, Context, ContractPromise } from "near-sdk-as";

/**
 * Account IDs in NEAR are just strings.
 */
export type AccountId = string;

/**
 * Gas is u64
 */
export type Gas = u64;

/**
 * Amounts, Balances, and Money in NEAR is are u128.
 */

export type Amount = u128;

export type Timestamp = u64;

export type Description = string;
export type Duration = u16;
export type Interval = u32;
export type Excuse = string;

export const ONE_NEAR = u128.from("1000000000000000000000000");
export const XCC_GAS: Gas = 5_000_000_000_000;
export const ONE_DAY_MILLISECOND: u32 = 86400000 //1000 * 60 * 60 * 24

/**
 * == FUNCTIONS ================================================================
 */

/**
 * @function asNEAR
 * @param amount {u128} - Yocto Ⓝ token quantity as an unsigned 128-bit integer
 * @returns {string}    - Amount in NEAR, as a string
 *
 * @example
 *
 *    asNEAR(7000000000000000000000000)
 *    // => '7'
 */
export function asNEAR(amount: u128): string {
  return u128.div(amount, ONE_NEAR).toString();
}

/**
 * @function toYocto
 * @param amount {number} - Integer to convert
 * @returns {u128}        - Amount in yocto Ⓝ as an unsigned 128-bit integer
 *
 * @example
 *
 *    toYocto(7)
 *    // => 7000000000000000000000000
 */
export function toYocto(amount: number): u128 {
  return u128.mul(ONE_NEAR, u128.from(amount))
}
