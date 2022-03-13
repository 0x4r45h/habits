import {Amount, Timestamp, Description, Duration, Excuse, Interval} from "../../utils";
import {Context} from "near-sdk-as";

@nearBindgen
export class Goal {
    public remainingDuration: Duration;
    public remainingCollateral: Amount;
    public failExcuses : Array<Excuse> = [];
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
    noProgress(excuse: Excuse): void {
        this.updatedAt = Context.blockTimestamp / 1_000_000;
        this.failExcuses.push(excuse);
    }
}