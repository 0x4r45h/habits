import {Amount, Timestamp, Description, Period, Reason} from "../../utils";
import {Context, PersistentVector} from "near-sdk-as";

@nearBindgen
export class Goal {
    public remainingPeriod: Period;
    public remainingCollateral: Amount;
    public failReasons: PersistentVector<Reason>
    constructor(
        public collateral: Amount,
        public description: Description,
        /**
         * period counted in days
         */
        public goalPeriod: Period,
        public updatedAt: Timestamp

    ) {
        this.remainingPeriod = goalPeriod;
        this.remainingCollateral = collateral;
    }
    progress(): void {
        this.updatedAt = Context.blockTimestamp / 1_000_000;
        if (this.remainingPeriod > 0) {
            this.remainingPeriod--;
        }
    }
    noProgress(reason: Reason): void {
        this.updatedAt = Context.blockTimestamp / 1_000_000;
        this.failReasons.push(reason);
    }
}