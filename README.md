# Habits

This repository is a very simple smart contract that helps users to build up good habits by force! it is written in AssemblyScript contracts targeting the NEAR platform.

## Concept

The contract provided here enable users to set an important goal, lock some near as collateral, update their progress toward the goal 
publicly and face punishment (by slashing collateral) if they don't follow their own rules. 

Think of it like a deadline in a contract between an employee and employer. but employee here, instead of a company is a cold-hearted 
smart contract on the NEAR blockchain

### Example Story

For the sake of this explanation, we'll assume contract user is : Alice

1. Alice plans to study English for 30 days, but can't keep herself motivated for that long, so she creates a **Goal** with a proper description, daily progress update rule and 10 near as collateral.
2. She must report her progress to the contract daily. after 30 successful reports, the goal is concluded and the remaining collaterals will get sent back to her wallet.
3. if she can't study on a day , still a report must be made to the contract but with an **Excuse**. there won't be any penalty for a day without progress, just publishing her excuse on blockchain would be enough.
4. if contract does not receive any update from alice within a certain period of time (3 Days hard coded, at the moment), the collateral gets slashed by 10% (again hard corded at the moment)
5. the goal is considered as done whether by fulfilling its purpose or losing the whole collateral due to many slashes

## Usage

INSTALL `NEAR CLI` first like this: `npm i -g near-cli`

1. clone this repo to a local folder
2. run `yarn`
3. run `./scripts/1.dev-deploy.sh`
4. run `./scripts/2.set-goal.sh`
5. run `./scripts/3.update-progress.sh`

for more info about parameters definitions refer to corresponding script file

