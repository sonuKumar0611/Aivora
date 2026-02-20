import app from './app';
import { connectDB } from './config/db';
import { env } from './utils/env';

async function main() {
  await connectDB();
  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT} (${env.NODE_ENV})`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
