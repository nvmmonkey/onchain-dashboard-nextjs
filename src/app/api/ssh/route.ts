import { NextRequest, NextResponse } from "next/server";
import { SSHManager } from "@/lib/ssh-manager";

let sshManager: SSHManager | null = null;

export async function POST(request: NextRequest) {
  try {
    const { action, ...params } = await request.json();

    switch (action) {
      case "connect":
        if (sshManager) {
          sshManager.disconnect();
        }

        sshManager = new SSHManager({
          host: process.env.SSH_HOST!,
          port: parseInt(process.env.SSH_PORT || "22"),
          username: process.env.SSH_USERNAME!,
          password: process.env.SSH_PASSWORD,
          privateKey: process.env.SSH_PRIVATE_KEY_PATH,
        });

        await sshManager.connect();
        return NextResponse.json({ success: true, message: "Connected" });

      case "disconnect":
        if (sshManager) {
          sshManager.disconnect();
          sshManager = null;
        }
        return NextResponse.json({ success: true, message: "Disconnected" });

      case "execute":
        if (!sshManager) {
          return NextResponse.json({ error: "Not connected" }, { status: 400 });
        }

        const result = await sshManager.executeCommand(params.command);
        return NextResponse.json({ success: true, result });

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
