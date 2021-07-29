Testing
=====

Unit testing is available through Jest library. To achive good readability of tests results, we are using `jest-clean-reporter` and `jest-stare` reporter.  

Package `jest-clean-reporter` overrides default Jest reporter and hides logging of traces, and package `jest-stare` create readable report in web format: `dist/jest-stare/index.html`.  

Test usage: `yarn workspace @app/condo test`