#!/usr/bin/env bash
set -e

[ -z "$CONTRACT_NAME" ] && echo "Missing \$CONTRACT_NAME environment variable" && exit 1
[ -z "$ACCOUNT_ID" ] && echo "Missing \$ACCOUNT_ID environment variable" && exit 1

[ -z "$1" ] && echo "tell if you had any progress or not with true / false" && exit 1

reason="";
if [ $1 = false ]; then
    [ -z "$2" ] && echo "reason is missing" && exit 1
    reason=$2;
fi

near call $CONTRACT_NAME post_progress --accountId $ACCOUNT_ID "{\"hadProgress\" : $1, \"reason\" : \"$2\"}"
exit 0
