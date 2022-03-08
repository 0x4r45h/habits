import {Context, ContractPromiseBatch, logging, PersistentMap, u128} from "near-sdk-as";
import {Goal} from "./models";
import {
    AccountId,
    Amount,
    Description,
    ONE_DAY_MILLISECOND,
    ONE_NEAR,
    Duration, Reason,
    Timestamp,
    XCC_GAS,
    Interval,
} from "../../utils";

@nearBindgen
export class Contract {
    private treasury : Amount;
    private owner: AccountId;
    constructor(owner : AccountId) {
        this.treasury = Context.attachedDeposit;
        this.owner = owner;
    }
    post_goal(description: Description, duration: Duration, interval: Interval = ONE_DAY_MILLISECOND): void {
        const sender = Context.sender;
        const deposit = Context.attachedDeposit;
        assert(deposit>= ONE_NEAR, "You must post at least one near as collateral");
        //TODO : uncomment this
        // assert(! accountGoals.contains(sender), "You already have an active goal");
        const now: u64 = Context.blockTimestamp / 1_000_000;
        const goal = new Goal(deposit, description, duration, interval, now );
        accountGoals.set(sender, goal);
    }

    @mutateState()
    post_progress(hadProgress: boolean, reason : Reason): void {
        const sender = Context.sender;
        const goal = accountGoals.getSome(sender)
        const passedIntervals = Contract.passedIntervals(goal.updatedAt, goal.interval);
        logging.log("ticks passed since last update: " + passedIntervals.toString());
        // should be able to call this function only once in each interval
        assert(passedIntervals > 0, "You can update your progress only once every " + goal.interval.toString() + "milliseconds");
        if (passedIntervals > 3) {
            logging.log("going to slash...");

            //should slash
            const perSlash = 10;
            const multiplier = passedIntervals / 3;
            const slashAmount = u128.div(u128.mul(goal.collateral, u128.from(perSlash * multiplier)), u128.from(100));
            logging.log("slash amount : " + slashAmount.toString());

            this.slash(slashAmount, goal);

            if (goal.remainingCollateral == u128.Zero) {
                // close the goal
                accountGoals.delete(sender);
                return;
            }

        }
        if (hadProgress) {
            // good job reduce the remaining duration by one unit
            goal.progress();
            if (goal.remainingDuration == 0) {
                // close the goal
                accountGoals.delete(sender);
                // return funds to owner
                const to_sender = ContractPromiseBatch.create(sender);
                const self = Context.contractName;

                to_sender.transfer(goal.remainingCollateral);

                to_sender.then(self).function_call("on_payout_complete", "{}", u128.Zero, XCC_GAS);
                return;
            }
            accountGoals.set(sender, goal);
            return;
        }
        // should have reason
        assert(reason != '', "You should Explain why you couldn't make progress")
        goal.noProgress(reason);
        accountGoals.set(sender, goal);

    }

    private slash(slashAmount: u128, goal: Goal): void {
        if (slashAmount >= goal.remainingCollateral) {
            this.treasury = u128.add(this.treasury, goal.remainingCollateral);
            goal.remainingCollateral = u128.Zero;
            return;
        }
        this.treasury = u128.add(this.treasury, slashAmount);
        goal.remainingCollateral = u128.sub(goal.remainingCollateral, slashAmount);
    }

    private static passedIntervals(date: Timestamp, interval: Interval) : u64{
        const now: u64 = Context.blockTimestamp / 1_000_000;
        return (now - date)  / interval;
    }
    // this function should only get called from within our contract
    on_payout_complete(): void {
        Contract.assert_self();
    }
    private static assert_self(): void {
        assert(Context.predecessor == Context.contractName, "Only this contract may call itself")
    }
}

const accountGoals: PersistentMap<AccountId, Goal> = new PersistentMap<AccountId, Goal>("g");
