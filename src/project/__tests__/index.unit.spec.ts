import {Context, u128, VMContext} from "near-sdk-as";
import {Amount, asNEAR, Description, Duration, Interval, ONE_NEAR, Timestamp, toYocto} from "../../utils";
import { Contract } from "../assembly";
import {Goal} from "../assembly/models";

let contract: Contract
const MIN_DEPOSIT = 1;
const DEFAULT_ACCOUNT = 'bob';
const CONTRACT_ACCOUNT = 'contract';

const setCurrentAccount = (): void => {
  VMContext.setCurrent_account_id(CONTRACT_ACCOUNT);
};
const attachDeposit = (deposit: number): void => {
  VMContext.setAttached_deposit(toYocto(deposit));
};
const createGoal = (deposit: Amount = u128.from(10), description: Description = 'some description', duration : Duration = 5, interval: Interval = 3, updatedAt :  Timestamp = Context.blockTimestamp / 1_000_000): Goal => {
  return new Goal(deposit, description, duration, interval, updatedAt );
}
const mockBlockTimeStamp = (tsInMillisecond : Timestamp = Date.now() as Timestamp) : Timestamp => {
  VMContext.setBlock_timestamp(tsInMillisecond * 1_000_000); // near timestamps are in nano but Date.now() is in milli
  return tsInMillisecond;
}
beforeEach(() => {
  contract = new Contract();
  setCurrentAccount();
})

describe("Create a goal", () => {

  throws("fails if attached near is lower than min deposit", () => {
    contract.post_goal('desc', 3);
  })
  throws("fails if a goal already exists for the account", () => {
    attachDeposit(MIN_DEPOSIT);
    contract.get_accounts_goals().set('bob', createGoal())
    contract.post_goal('desc', 3);
  })
  it("should save a goal on storage", () => {
    // arrange
    attachDeposit(MIN_DEPOSIT);
    const mockNow = mockBlockTimeStamp();

    const description = 'new goal';
    const duration:u16 = 3;
    const interval:u32 = 5;
    // Act
    contract.post_goal('new goal', 3, 5);
    // Assert
    const goal = contract.get_accounts_goals().getSome(DEFAULT_ACCOUNT);
    expect(goal.collateral).toStrictEqual(toYocto(MIN_DEPOSIT), "collateral mismatch");
    expect(goal.description).toStrictEqual(description, "description mismatch");
    expect(goal.goalDuration).toStrictEqual(duration, "goalDuration mismatch");
    expect(goal.interval).toStrictEqual(interval, "interval mismatch");
    expect(goal.updatedAt).toStrictEqual(mockNow, "updatedAt mismatch");
    expect(goal.remainingDuration).toStrictEqual(duration, "remainingDuration mismatch");
    expect(goal.remainingCollateral).toStrictEqual(toYocto(MIN_DEPOSIT), "remainingCollateral mismatch");
  });
});
describe("Update a goal's progress", () => {

  throws("should not be able to update progress before at least one interval has passed", () => {
    const goal = createGoal(toYocto(1), 'something', 5, 30000);
    contract.get_accounts_goals().set(DEFAULT_ACCOUNT, goal)

    contract.post_progress(true, '');
  })
  it("should slash user's collateral, if dont receive update after more than 3 intervals", () => {
    let mockNow = mockBlockTimeStamp();
    const duration: Duration= 5;
    const goal = createGoal(toYocto(10), 'something', duration, 2);
    contract.get_accounts_goals().set(DEFAULT_ACCOUNT, goal);
    mockNow+= 12; // each slash requires (3 x intervals), so 12 means two slashes in a row
    mockBlockTimeStamp(mockNow)

    contract.post_progress(true, '');

    const updatedGoal = contract.get_accounts_goals().getSome(DEFAULT_ACCOUNT);
    expect(updatedGoal.updatedAt).toStrictEqual(mockNow, "updatedAt mismatch");
    // expect 20% slash
    expect(updatedGoal.remainingCollateral).toStrictEqual(toYocto(8), "remainingCollateral mismatch");
    expect(contract.treasury).toStrictEqual(toYocto(2), "treasury mismatch");
  })

  describe("hadProgress = false scenarios", () => {

    throws("should fail if hadProgress is false while reason is empty", () => {
      const mockNow = mockBlockTimeStamp();
      const goal = createGoal(toYocto(1), 'something', 5, 2);
      contract.get_accounts_goals().set(DEFAULT_ACCOUNT, goal)

      mockBlockTimeStamp(mockNow + 4)
      contract.post_progress(false, '');
    })
    it("should save no progress reason", () => {
      let mockNow = mockBlockTimeStamp();
      const duration: Duration= 5;
      const goal = createGoal(toYocto(1), 'something', duration, 2);
      contract.get_accounts_goals().set(DEFAULT_ACCOUNT, goal);
      mockNow+= 4;
      mockBlockTimeStamp(mockNow)

      contract.post_progress(false, 'laziness');

      const updatedGoal = contract.get_accounts_goals().getSome(DEFAULT_ACCOUNT);
      expect(updatedGoal.updatedAt).toStrictEqual(mockNow);
      expect(updatedGoal.failReasons[0]).toStrictEqual('laziness');
      expect(updatedGoal.remainingCollateral).toStrictEqual(toYocto(1));
      expect(updatedGoal.remainingDuration).toStrictEqual(duration);
    })
  });
  describe("hadProgress = true scenarios", () => {

    it("should reduce remainingDuration by one unit", () => {
      let mockNow = mockBlockTimeStamp();
      const goal = createGoal(toYocto(1), 'something', 5, 2);
      contract.get_accounts_goals().set(DEFAULT_ACCOUNT, goal)
      mockNow+= 4;
      mockBlockTimeStamp(mockNow )
      contract.post_progress(true, '');

      const updatedGoal = contract.get_accounts_goals().getSome(DEFAULT_ACCOUNT);
      expect(updatedGoal.updatedAt).toStrictEqual(mockNow);
      expect(updatedGoal.remainingDuration).toStrictEqual(4 as Duration);
    });
    it("should delete the goal and release the collateral, when remaining duration reaches to 0", () => {
      let mockNow = mockBlockTimeStamp();
      const duration: Duration = 1;
      VMContext.setAccount_balance(toYocto(5));

      const goal = createGoal(toYocto(1), 'something', duration, 2);
      contract.get_accounts_goals().set(DEFAULT_ACCOUNT, goal);
      mockNow+= 4;
      mockBlockTimeStamp(mockNow)

      contract.post_progress(true, '');

      const updatedGoal = contract.get_accounts_goals().get(DEFAULT_ACCOUNT);
      expect(updatedGoal).toBeNull("Goal is not removed");

      // Cannot test cross contract calls in Unit tests
    })
  });



})
