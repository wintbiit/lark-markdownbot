import { LarkClient } from "./lark.ts";
import Logger from "https://deno.land/x/logger@v1.1.6/logger.ts";

interface LarkMessage {
  message_id: string;
  root_id?: string;
  parent_id?: string;
  create_time: string;
  update_time?: string;
  chat_id: string;
  thread_id?: string;
  chat_type: string;
  message_type: string;
  content: string;
  mentions?: Array<{
    key: string;
    id: {
      union_id?: string;
      user_id?: string;
      open_id?: string;
    };
    name: string;
    tenant_key?: string;
  }>;
}

interface LarkMessageEvent {
  event_id?: string;
  token?: string;
  create_time?: string;
  event_type?: string;
  tenant_key?: string;
  ts?: string;
  uuid?: string;
  type?: string;
  app_id?: string;
  sender: {
    sender_id?: {
      union_id?: string;
      user_id?: string;
      open_id?: string;
    };
    sender_type: string;
    tenant_key?: string;
  };
  message: LarkMessage;
}

interface FileMessageContent {
  file_key: string;
  file_name: string;
}

const logger = new Logger();

export async function messageHandler(
  client: LarkClient,
  ctx: LarkMessageEvent,
) {
  const messageId = ctx.message.message_id;
  if (ctx.message.chat_type == "p2p") {
    logger.info(
      `Receive message ${messageId} from user: ${
        ctx.sender.sender_id!.open_id
      }`,
    );
    await onUserSendMessage(client, ctx.message);
  } else if (ctx.message.chat_type == "group") {
    if (ctx.message.mentions?.find((m) => m.key.includes("all"))) {
      return;
    }

    logger.info(
      `Receive message ${messageId} from group: ${ctx.message.chat_id} by user: ${
        ctx.sender.sender_id!.open_id
      }`,
    );
    await onGroupReceiveMessage(client, ctx);
  }
}

const onUserSendMessage = async (client: LarkClient, ctx: LarkMessage) => {
  if (ctx.message_type != "file") {
    await addEmoji(client, ctx.message_id, "EMBARRASSED");
    return;
  }

  const content: FileMessageContent = JSON.parse(ctx.content);
  if (!content.file_name.endsWith(".md")) {
    await addEmoji(client, ctx.message_id, "EMBARRASSED");
    return;
  }

  await startReplyMarkdown(client, ctx.message_id, content.file_key);
  await addEmoji(client, ctx.message_id, "BubbleTea");
};

const onGroupReceiveMessage = async (
  client: LarkClient,
  ctx: LarkMessageEvent,
) => {
  if (!ctx.message.parent_id) {
    await addEmoji(client, ctx.message.message_id, "EMBARRASSED");
    return;
  }

  const parentMessage = await client.client.im.message.get({
    path: {
      message_id: ctx.message.parent_id,
    },
  });

  if (
    parentMessage.data?.items?.length == undefined ||
    parentMessage.data.items.length == 0
  ) {
    throw new Error(
      `Get message ${ctx.message.parent_id} failed: [${parentMessage.code}] ${parentMessage.msg}`,
    );
  }

  const msg = parentMessage.data.items[0];

  if (msg.msg_type != "file") {
    await addEmoji(client, ctx.message.message_id, "EMBARRASSED");
    return;
  }

  const content: FileMessageContent = JSON.parse(msg.body?.content!);
  if (!content.file_name.endsWith(".md")) {
    await addEmoji(client, ctx.message.message_id, "EMBARRASSED");
    return;
  }

  await startReplyMarkdown(client, msg.message_id!, content.file_key);
  await addEmoji(client, ctx.message.message_id, "BubbleTea");
};

const addEmoji = async (
  client: LarkClient,
  messageId: string,
  emoji: string,
) => {
  await client.client.im.messageReaction.create({
    data: {
      reaction_type: {
        emoji_type: emoji,
      },
    },
    path: {
      message_id: messageId,
    },
  });
};

const startReplyMarkdown = async (
  client: LarkClient,
  messageId: string,
  fileKey: string,
) => {
  const content = await client.client.request<string>({
    url: `/open-apis/im/v1/messages/${messageId}/resources/${fileKey}`,
    method: "GET",
    params: {
      type: "file",
    },
  });

  const card = {
    schema: "2.0",
    body: {
      elements: [
        {
          tag: "markdown",
          content: content,
        },
      ],
    },
  };

  const data = {
    msg_type: "interactive",
    content: JSON.stringify(card),
  };

  await client.client.im.message.reply({
    data: data,
    path: {
      message_id: messageId,
    },
  });
};
