import {
  AppType,
  Client,
  EventDispatcher,
  EventHandles,
  LoggerLevel,
  WSClient,
} from "https://esm.sh/@larksuiteoapi/node-sdk@1.35.0";

interface LarkConfig {
  appId: string;
  appSecret: string;
  appType?: AppType;
  loggerLevel?: LoggerLevel;
  encryptKey?: string;
  verificationToken?: string;
}

class LarkClient {
  private larkConfig: LarkConfig;
  public client: Client;
  private wsClient: WSClient;
  private eventDispatcher: EventDispatcher;

  constructor(
    config: LarkConfig,
  ) {
    this.larkConfig = config;
    if (!this.larkConfig.appType) {
      this.larkConfig.appType = AppType.SelfBuild;
    }
    if (!this.larkConfig.loggerLevel) {
      this.larkConfig.loggerLevel = LoggerLevel.info;
    }

    this.client = new Client(this.larkConfig);
    this.wsClient = new WSClient(this.larkConfig);
    this.eventDispatcher = new EventDispatcher(this.larkConfig);
  }

  register<T = {}>(handles: EventHandles & T) {
    this.eventDispatcher.register(handles);
  }

  public start() {
    this.wsClient.start({ eventDispatcher: this.eventDispatcher });
  }
}

export { LarkClient };
