import { contextBridge } from "electron";
import { platform } from "os";

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform
})