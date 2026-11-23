# Host the private pilot

The protected Vercel preview keeps its demo database in memory. Use a separate container and disk for the persistence rehearsal. Keep the pilot behind an access-controlled HTTPS proxy. [Pilot acceptance gates](pilot-acceptance.md#gates)

## Run the app

1. Build the image and create a dedicated Docker volume. Run one app container against that volume. Use disk storage that supports SQLite file locks.

   ```sh
   docker build -t public-horses-pilot .
   docker volume create public-horses-pilot-data
   ```

2. Set these variables in a private environment file. Use a separate Public Horses Clerk test instance and its matching test keys. Keep the environment file out of Git and the image. [Clerk test accounts](https://clerk.com/docs/guides/development/testing/test-emails-and-phones)

   ```dotenv
   PH_ORIGIN=https://pilot.example.org
   CLERK_PUBLISHABLE_KEY=pk_test_replace_me
   CLERK_SECRET_KEY=sk_test_replace_me
   ```

3. Use the exact HTTPS scheme, host, and port provided by the proxy. Preserve the original Host header when the proxy forwards requests to the app. Restrict the HTTP port to loopback.

   ```sh
   docker run -d --name public-horses-pilot --env-file .env.pilot --mount "type=volume,src=public-horses-pilot-data,dst=/data" -p 127.0.0.1:4173:4173 public-horses-pilot
   ```

The container runs as the `node` user. It creates `/data/marketplace.sqlite` on the mounted disk. Use a test account to sign in and assign its reviewer role as needed. [Reviewer setup](../README.md#connect-clerk)

## Check restart and restore

1. Use fictional accounts to publish and fulfill a listing. Save a private service record and a later observation. Restart the container. Sign in again and check those same records.

   ```sh
   docker restart public-horses-pilot
   ```

2. Take a backup while the app runs. Use a new destination on disk. The command saves committed SQLite data, checks the snapshot, and publishes it as a single file. Copy that file to a new path in protected backup storage.

   ```sh
   docker exec public-horses-pilot node scripts/backup-database.mjs /data/marketplace.sqlite /data/pilot-backup-001.sqlite
   ```

3. Prepare a new database from the saved copy. Keep the active database in place. Start a separate private container with `PH_DB_PATH=/data/restore-check-001.sqlite`. Give that container its own proxy origin and loopback port.

   ```sh
   docker exec public-horses-pilot node scripts/backup-database.mjs /data/pilot-backup-001.sqlite /data/restore-check-001.sqlite
   docker run -d --name public-horses-restore-check --env-file .env.restore --env PH_DB_PATH=/data/restore-check-001.sqlite --mount "type=volume,src=public-horses-pilot-data,dst=/data" -p 127.0.0.1:4174:4173 public-horses-pilot
   ```

4. Sign in to the restored app with the same fictional identities. Check the reviewed listing, fulfillment, service record, and observation. Verify that a different account has access only to its own garden.

Keep database files and backup copies private. Save test results as statuses and record identifiers. Apply the live pilot gate after the approved host passes sign-in and recovery checks. [Pilot acceptance gates](pilot-acceptance.md#gates)
