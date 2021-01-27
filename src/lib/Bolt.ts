import { Socket } from 'net';
import { IMessage, IConfig, EventType, IJoinLeave, IError, IMotd } from '../interfaces';
import { MessageManager } from './Message/MessageManager';

export class Bolt {
  /**
   * Everything related to message.
   */
  message: MessageManager;

  /**
   * The socket used to connect to the server.
   * You probaly shouldn't use this.
   */
  connection: Socket;

  /**
   * The config.
   */
  protected config: IConfig;

  constructor(config: IConfig) {
    this.config = config;
    this.connection = new Socket();
    this.message = new MessageManager(this.config, this.connection);
  }

  async connect(callback?: () => void): Promise<void> {
    return await new Promise((resolve, reject) => {
      this.connection.connect(
        {
          port: this.config.port,
          host: this.config.host
        },
        () => {
          if (callback) callback();

          resolve();
        }
      );

      this.connection.on('error', reject); // TODO: check if this is valid

      const time = Math.round(new Date().getTime() / 1000);
      const joinData: IJoinLeave = {
        user: {
          nick: this.config.username
        },
        e: {
          t: 'join',
          c: time
        }
      };

      this.connection.write(JSON.stringify(joinData));
    });
  }

  /**
   * Execute the callback if event.
   * @param event Event to listen to.
   * @param callback Callback function.
   */
  public on(event: 'msg', callback: (data: IMessage) => void): void;

  public on(event: 'join', callback: (data: IJoinLeave) => void): void;

  public on(event: 'leave', callback: (data: IJoinLeave) => void): void;

  public on(event: 'err', callback: (data: IError) => void): void;

  public on(event: 'motd', callback: (data: IMotd) => void): void;

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
  public on(event: EventType, callback: (data: any) => void): void {
    this.connection.on('data', (d) => {
      const data = JSON.parse(d.toString());
      if (data.e.t !== event) return;
      callback(data);
    });
  }
}
