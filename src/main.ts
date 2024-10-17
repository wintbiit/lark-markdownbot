import { LarkClient } from "./lark.ts";
import { messageHandler } from "./handler.ts";
import "jsr:@std/dotenv/load";
import Logger from "https://deno.land/x/logger@v1.1.6/logger.ts";

const LARK_APP_ID = Deno.env.get("LARK_APP_ID") ?? Deno.exit(1);
const LARK_APP_SECRET = Deno.env.get("LARK_APP_SECRET") ?? Deno.exit(1);
const LARK_APP_VERIFICATION_TOKEN =
  Deno.env.get("LARK_APP_VERIFICATION_TOKEN") ?? undefined;
const LARK_APP_ENCRYPT_KEY = Deno.env.get("LARK_APP_ENCRYPT_KEY") ?? undefined;

const logger = new Logger();

const larkClient = new LarkClient({
  appId: LARK_APP_ID,
  appSecret: LARK_APP_SECRET,
  verificationToken: LARK_APP_VERIFICATION_TOKEN,
  encryptKey: LARK_APP_ENCRYPT_KEY,
});

larkClient.register({
  "im.message.receive_v1": (ctx) => {
    messageHandler(larkClient, ctx).catch((e) => {
      logger.error(`Error handling message: ${ctx.message.message_id}`, e);
    }).finally(() => {
      logger.info(`Message handled: ${ctx.message.message_id}`);
    });
  },
});

larkClient.start();
