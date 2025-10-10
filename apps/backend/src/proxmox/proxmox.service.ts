import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { Agent } from 'https';

export interface ProxmoxCredentials {
  host: string;
  port: number;
  username: string;
  password: string;
}

@Injectable()
export class ProxmoxService {
  private readonly logger = new Logger(ProxmoxService.name);
  private clients: Map<string, AxiosInstance> = new Map();

  private getClient(nodeId: string, credentials: ProxmoxCredentials): AxiosInstance {
    if (!this.clients.has(nodeId)) {
      const client = axios.create({
        baseURL: `https://${credentials.host}:${credentials.port}/api2/json`,
        httpsAgent: new Agent({ rejectUnauthorized: false }),
      });
      this.clients.set(nodeId, client);
    }
    return this.clients.get(nodeId);
  }

  async authenticate(nodeId: string, credentials: ProxmoxCredentials): Promise<string> {
    const client = this.getClient(nodeId, credentials);
    const response = await client.post('/access/ticket', {
      username: credentials.username,
      password: credentials.password,
    });
    return response.data.data.ticket;
  }

  async cloneVm(
    nodeId: string,
    credentials: ProxmoxCredentials,
    ticket: string,
    nodeName: string,
    templateId: number,
    newVmId: number,
    name: string
  ): Promise<any> {
    const client = this.getClient(nodeId, credentials);
    const response = await client.post(
      `/nodes/${nodeName}/qemu/${templateId}/clone`,
      {
        newid: newVmId,
        name,
        full: 1,
      },
      {
        headers: { Cookie: `PVEAuthCookie=${ticket}` },
      }
    );
    return response.data.data;
  }

  async configureVm(
    nodeId: string,
    credentials: ProxmoxCredentials,
    ticket: string,
    nodeName: string,
    vmId: number,
    config: {
      cores?: number;
      memory?: number;
      ipconfig0?: string;
      ciuser?: string;
      cipassword?: string;
      nameserver?: string;
    }
  ): Promise<any> {
    const client = this.getClient(nodeId, credentials);
    const response = await client.post(`/nodes/${nodeName}/qemu/${vmId}/config`, config, {
      headers: { Cookie: `PVEAuthCookie=${ticket}` },
    });
    return response.data.data;
  }

  async resizeDisk(
    nodeId: string,
    credentials: ProxmoxCredentials,
    ticket: string,
    nodeName: string,
    vmId: number,
    disk: string,
    size: string
  ): Promise<any> {
    const client = this.getClient(nodeId, credentials);
    const response = await client.put(
      `/nodes/${nodeName}/qemu/${vmId}/resize`,
      { disk, size },
      {
        headers: { Cookie: `PVEAuthCookie=${ticket}` },
      }
    );
    return response.data.data;
  }

  async startVm(
    nodeId: string,
    credentials: ProxmoxCredentials,
    ticket: string,
    nodeName: string,
    vmId: number
  ): Promise<any> {
    const client = this.getClient(nodeId, credentials);
    const response = await client.post(
      `/nodes/${nodeName}/qemu/${vmId}/status/start`,
      {},
      {
        headers: { Cookie: `PVEAuthCookie=${ticket}` },
      }
    );
    return response.data.data;
  }

  async stopVm(
    nodeId: string,
    credentials: ProxmoxCredentials,
    ticket: string,
    nodeName: string,
    vmId: number
  ): Promise<any> {
    const client = this.getClient(nodeId, credentials);
    const response = await client.post(
      `/nodes/${nodeName}/qemu/${vmId}/status/stop`,
      {},
      {
        headers: { Cookie: `PVEAuthCookie=${ticket}` },
      }
    );
    return response.data.data;
  }

  async rebootVm(
    nodeId: string,
    credentials: ProxmoxCredentials,
    ticket: string,
    nodeName: string,
    vmId: number
  ): Promise<any> {
    const client = this.getClient(nodeId, credentials);
    const response = await client.post(
      `/nodes/${nodeName}/qemu/${vmId}/status/reboot`,
      {},
      {
        headers: { Cookie: `PVEAuthCookie=${ticket}` },
      }
    );
    return response.data.data;
  }

  async getVmStatus(
    nodeId: string,
    credentials: ProxmoxCredentials,
    ticket: string,
    nodeName: string,
    vmId: number
  ): Promise<any> {
    const client = this.getClient(nodeId, credentials);
    const response = await client.get(`/nodes/${nodeName}/qemu/${vmId}/status/current`, {
      headers: { Cookie: `PVEAuthCookie=${ticket}` },
    });
    return response.data.data;
  }

  async deleteVm(
    nodeId: string,
    credentials: ProxmoxCredentials,
    ticket: string,
    nodeName: string,
    vmId: number
  ): Promise<any> {
    const client = this.getClient(nodeId, credentials);
    const response = await client.delete(`/nodes/${nodeName}/qemu/${vmId}`, {
      headers: { Cookie: `PVEAuthCookie=${ticket}` },
    });
    return response.data.data;
  }

  async createSnapshot(
    nodeId: string,
    credentials: ProxmoxCredentials,
    ticket: string,
    nodeName: string,
    vmId: number,
    snapname: string,
    description?: string
  ): Promise<any> {
    const client = this.getClient(nodeId, credentials);
    const response = await client.post(
      `/nodes/${nodeName}/qemu/${vmId}/snapshot`,
      { snapname, description },
      {
        headers: { Cookie: `PVEAuthCookie=${ticket}` },
      }
    );
    return response.data.data;
  }

  async deleteSnapshot(
    nodeId: string,
    credentials: ProxmoxCredentials,
    ticket: string,
    nodeName: string,
    vmId: number,
    snapname: string
  ): Promise<any> {
    const client = this.getClient(nodeId, credentials);
    const response = await client.delete(`/nodes/${nodeName}/qemu/${vmId}/snapshot/${snapname}`, {
      headers: { Cookie: `PVEAuthCookie=${ticket}` },
    });
    return response.data.data;
  }

  async rollbackSnapshot(
    nodeId: string,
    credentials: ProxmoxCredentials,
    ticket: string,
    nodeName: string,
    vmId: number,
    snapname: string
  ): Promise<any> {
    const client = this.getClient(nodeId, credentials);
    const response = await client.post(
      `/nodes/${nodeName}/qemu/${vmId}/snapshot/${snapname}/rollback`,
      {},
      {
        headers: { Cookie: `PVEAuthCookie=${ticket}` },
      }
    );
    return response.data.data;
  }

  async getConsoleUrl(
    nodeId: string,
    credentials: ProxmoxCredentials,
    ticket: string,
    nodeName: string,
    vmId: number
  ): Promise<any> {
    const client = this.getClient(nodeId, credentials);
    const response = await client.post(
      `/nodes/${nodeName}/qemu/${vmId}/vncproxy`,
      {},
      {
        headers: { Cookie: `PVEAuthCookie=${ticket}` },
      }
    );
    return response.data.data;
  }

  async waitForTask(
    nodeId: string,
    credentials: ProxmoxCredentials,
    ticket: string,
    nodeName: string,
    upid: string,
    timeout: number = 300000
  ): Promise<boolean> {
    const client = this.getClient(nodeId, credentials);
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const response = await client.get(`/nodes/${nodeName}/tasks/${upid}/status`, {
        headers: { Cookie: `PVEAuthCookie=${ticket}` },
      });

      const status = response.data.data.status;
      if (status === 'stopped') {
        return response.data.data.exitstatus === 'OK';
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    return false;
  }

  async getNextVmId(
    nodeId: string,
    credentials: ProxmoxCredentials,
    ticket: string
  ): Promise<number> {
    const client = this.getClient(nodeId, credentials);
    const response = await client.get('/cluster/nextid', {
      headers: { Cookie: `PVEAuthCookie=${ticket}` },
    });
    return parseInt(response.data.data);
  }
}
