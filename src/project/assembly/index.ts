import {Context,
    ContractPromise, ContractPromiseBatch, logging, PersistentDeque, PersistentMap, PersistentSet, PersistentVector, u128} from "near-sdk-as";
import {Goal} from "./models";
import {
    AccountId,
    Amount,
    Description,
    ONE_DAY_MILLISECOND,
    ONE_NEAR,
    Period, Reason,
    Timestamp,
    toYocto,
    XCC_GAS
} from "../../utils";

@nearBindgen
export class Contract {
    private treasury : Amount;
    constructor() {
        this.treasury = Context.attachedDeposit;
    }
    post_goal(description: Description, period: Period): void {
        const sender = Context.sender;
        const deposit = Context.attachedDeposit;
        assert(deposit>= toYocto(1), "You must post at least one near as collateral");
        //TODO : uncomment this
        // assert(! accountGoals.contains(sender), "You already have an active goal");
        const now: u64 = Context.blockTimestamp / 1_000_000;
        const goal = new Goal(deposit, description, period, now );
        accountGoals.set(sender, goal);
    }

    @mutateState()
    post_progress(hadProgress: boolean, reason : Reason): void {
        const sender = Context.sender;
        const goal = accountGoals.getSome(sender)
        const daysSinceUpdate = this.diffInDays(goal.updatedAt);
        // should be able to call this function only once per day
        assert(daysSinceUpdate > 0, "You can update your progress only once per day");
        if (daysSinceUpdate > 3) {
            //should slash
            const perSlash = 10;
            const multiplier = daysSinceUpdate / 3;
            const slashAmount = u128.div(u128.mul(goal.collateral, u128.from(perSlash * multiplier)), u128.from(100));

            this.slash(slashAmount, goal);

            if (goal.remainingCollateral == u128.Zero) {
                // close the goal
                accountGoals.delete(sender);
                return;
            }

        }
        if (hadProgress) {
            // good job reduce the remaining period by one
            goal.progress();
            if (goal.remainingPeriod == 0) {
                // close the goal
                accountGoals.delete(sender);
                // return funds to owner
                const to_sender = ContractPromiseBatch.create(sender);
                const self = Context.contractName;

                to_sender.transfer(goal.collateral);

                to_sender.then(self).function_call("on_payout_complete", "{}", u128.Zero, XCC_GAS);
                return;
            }
            accountGoals.set(sender, goal);
            return;
        }
        // should have reason
        assert(reason != '', "You should Explain why you couldn't make progress today")
        goal.noProgress(reason);

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

    private diffInDays(date: Timestamp) : u64{
        // const now = dayjs()
        const now: u64 = Context.blockTimestamp / 1_000_000;
        return (now - date)  / ONE_DAY_MILLISECOND;
    }
    // this function should only get called from within our contract
    on_payout_complete(args: string): void {
        Contract.assert_self();
        logging.log(args)
    }
    private static assert_self(): void {
        assert(Context.predecessor == Context.contractName, "Only this contract may call itself")
    }
}

const accountGoals: PersistentMap<AccountId, Goal> = new PersistentMap<AccountId, Goal>("g");
const vector: PersistentVector<string> = new PersistentVector<string>("v");
const deque: PersistentDeque<string> = new PersistentDeque<string>("deq");
class Environment {
    static epoch: u64 = Context.epochHeight;
    static block: u64 = Context.blockIndex;
    static timestamp: u64 = Context.blockTimestamp;

    static contract: string = Context.contractName;
    static sender: string = Context.sender;
    static predecessor: string = Context.predecessor;

    static toString(prefix: string): string {
        let message = prefix
        message += '[e:' + this.epoch.toString() + '|b:' + this.block.toString() + '|t:' + this.timestamp.toString() + '] '
        message += '[c:' + this.contract + '|s:' + this.sender + '|p:' + this.predecessor + '] '
        return message
    }

    static capture(prefix: string = ''): string {
        return Environment.toString(prefix)
    }
}
