# news

This domain contains the news items logic

## Test and debug

### Delaying

You can use `NEWS_ITEMS_SENDING_DELAY_SEC` environment to decrease default delay (news items sending delayed like emails within GMail)

>Warning: some tests are checking that news items delaying, so these tests will fail in the case of 0 seconds delay.

The part of `.env` file:
```
...
NEWS_ITEMS_SENDING_DELAY_SEC=2
...
```
