import {loadTestEnv} from "./test-env.js"

// runs before each test file, so db.js connects to the test database when it's imported
loadTestEnv()
