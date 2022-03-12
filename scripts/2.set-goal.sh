#!/usr/bin/env bash

# exit on first error after this point to avoid redeploying with successful build
set -e

echo
echo ---------------------------------------------------------
echo "Step 0: Check for environment variable with contract name"
echo ---------------------------------------------------------
echo

[ -z "$CONTRACT_NAME" ] && echo "Missing \$CONTRACT_NAME environment variable" && exit 1
[ -z "$ACCOUNT_ID" ] && echo "Missing \$ACCOUNT_ID environment variable" && exit 1

[ -z "$1" ] && echo "attach 1 or more NEAR as collateral" && exit 1
[ -z "$2" ] && echo "goal description is missing" && exit 1
[ -z "$3" ] && echo "goal duration is related to intervals, it describes how many successful intervals should pass to consider a goal as complete" && exit 1
[ -z "$4" ] && echo "interval in milliseconds. defines how often you should report your progress. e.g 1 day is 86400000 milliseconds " && exit 1


echo
echo "about to create a new goal. when goal is set there is no turning back"
echo

near call $CONTRACT_NAME post_goal --accountId $ACCOUNT_ID "{\"description\" : \"$2\", \"duration\" : $3, \"interval\": $4}" --amount=$1

exit 0
