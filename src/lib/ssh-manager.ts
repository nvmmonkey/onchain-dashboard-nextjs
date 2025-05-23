import { Client } from "ssh2";
import { SSHConfig } from "./types";

export class SSHManager {
  private conn: Client;
  private config: SSHConfig;
  private isConnected: boolean = false;

  constructor(config: SSHConfig) {
    this.config = config;
    this.conn = new Client();
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.conn
        .on("ready", () => {
          this.isConnected = true;
          resolve();
        })
        .on("error", (err) => {
          this.isConnected = false;
          reject(err);
        })
        .connect(this.config);
    });
  }

  async executeCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error("SSH not connected"));
        return;
      }

      this.conn.exec(command, (err, stream) => {
        if (err) {
          reject(err);
          return;
        }

        let output = "";
        let errorOutput = "";

        stream
          .on("close", () => {
            if (errorOutput) {
              reject(new Error(errorOutput));
            } else {
              resolve(output);
            }
          })
          .on("data", (data: Buffer) => {
            output += data.toString();
          })
          .stderr.on("data", (data: Buffer) => {
            errorOutput += data.toString();
          });
      });
    });
  }

  async executeStream(
    command: string,
    onData: (data: string) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error("SSH not connected"));
        return;
      }

      this.conn.exec(command, (err, stream) => {
        if (err) {
          reject(err);
          return;
        }

        stream
          .on("close", () => {
            resolve();
          })
          .on("data", (data: Buffer) => {
            onData(data.toString());
          })
          .stderr.on("data", (data: Buffer) => {
            onData(`[ERROR] ${data.toString()}`);
          });
      });
    });
  }

  disconnect(): void {
    if (this.isConnected) {
      this.conn.end();
      this.isConnected = false;
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}
