process.env.JWT_SECRET = "test_secret_key_12345";
process.env.JWT_ACCESS_SECRET = "your_super_secret_key_1";
process.env.JWT_REFRESH_SECRET = "your_super_secret_key_2";
process.env.Node_ENV = "test";
// AWS S3 관련 (mocking)
process.env.AWS_REGION = "ap-northeast-2";
process.env.S3_BUCKET = "mock-bucket";
process.env.AWS_ACCESS_KEY_ID = "mock-key";
process.env.AWS_SECRET_ACCESS_KEY = "mock-secret";

process.env.NODE_ENV = "test";
