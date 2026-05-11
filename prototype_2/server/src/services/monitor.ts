import os from 'os';

export interface SystemMetrics {
  uptime: number;
  memory: {
    total: number;
    free: number;
    usage: number;
  };
  cpu: {
    load: number[];
    cores: number;
  };
  activeConnections: number;
  totalRequests: number;
  aiRequests: number;
  errorCount: number;
  legoStatus: 'connected' | 'simulated' | 'disconnected';
}

class MonitoringService {
  private startTime: number;
  private totalRequests: number = 0;
  private aiRequests: number = 0;
  private errorCount: number = 0;
  private activeConnections: number = 0;
  private legoStatus: 'connected' | 'simulated' | 'disconnected' = 'simulated';

  constructor() {
    this.startTime = Date.now();
  }

  public trackRequest() { this.totalRequests++; }
  public trackAIRequest() { this.aiRequests++; }
  public trackError() { this.errorCount++; }
  public setConnections(count: number) { this.activeConnections = count; }
  public setLegoStatus(status: 'connected' | 'simulated' | 'disconnected') { this.legoStatus = status; }

  public getMetrics(): SystemMetrics {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    
    return {
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      memory: {
        total: totalMem,
        free: freeMem,
        usage: ((totalMem - freeMem) / totalMem) * 100
      },
      cpu: {
        load: os.loadavg(),
        cores: os.cpus().length
      },
      activeConnections: this.activeConnections,
      totalRequests: this.totalRequests,
      aiRequests: this.aiRequests,
      errorCount: this.errorCount,
      legoStatus: this.legoStatus
    };
  }
}

export const monitor = new MonitoringService();
