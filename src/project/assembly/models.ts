import {Amount, Timestamp, Description, Duration, Reason, Interval} from "../../utils";
import {Context, PersistentVector} from "near-sdk-as";

@nearBindgen
export class Goal {
    public remainingDuration: Duration;
    public remainingCollateral: Amount;
    public failReasons : Array<Reason> = [];
    constructor(
        public collateral: Amount,
        public description: Description,
        public goalDuration: Duration,
        public interval: Interval,
        public updatedAt: Timestamp

    ) {
        this.remainingDuration = goalDuration;
        this.remainingCollateral = collateral;
    }
    progress(): void {
        this.updatedAt = Context.blockTimestamp / 1_000_000;
        if (this.remainingDuration > 0) {
            this.remainingDuration--;
        }
    }
    noProgress(reason: Reason): void {
        this.updatedAt = Context.blockTimestamp / 1_000_000;
        this.failReasons.push(reason);
    }
}