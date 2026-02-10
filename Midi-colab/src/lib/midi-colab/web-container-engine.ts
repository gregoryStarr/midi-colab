import { WebContainer } from '@webcontainer/api';
import type { ContainerInput, ContainerOutput, ScriptConfig } from './types';

export class WebContainerEngine {
  private static instance: WebContainerEngine | null = null;
  private webcontainer: WebContainer | null = null;

  static getInstance(): WebContainerEngine {
    // Check window for persisted instance across hot reloads
    if ((window as any).webContainerEngine) {
      return (window as any).webContainerEngine;
    }
    if (!WebContainerEngine.instance) {
      WebContainerEngine.instance = new WebContainerEngine();
      (window as any).webContainerEngine = WebContainerEngine.instance;
    }
    return WebContainerEngine.instance;
  }

  private constructor() {}

  async start(): Promise<void> {
    // Prevent multiple starts per page session
    if ((window as any).webContainerStarted) return;

    this.webcontainer = await WebContainer.boot();
    await this.webcontainer.mount({
      'package.json': {
         file: {
           contents: JSON.stringify({
             name: 'midi-processor',
             type: 'module',
             dependencies: {
               tonal: '^5.0.0'
             }
           }, null, 2)
         }
      },
      'scripts': {
        directory: {}
      }
    });

    // Install dependencies
    const installProcess = await this.webcontainer.spawn('npm', ['install']);
    const installExitCode = await installProcess.exit;
    if (installExitCode !== 0) {
      throw new Error('Failed to install dependencies in WebContainer');
    }

    (window as any).webContainerStarted = true;
  }

  async loadScript(config: ScriptConfig): Promise<void> {
    if (!this.webcontainer) throw new Error('Engine not started. Call start() first.');

    await this.webcontainer.fs.writeFile('input.js', config.code);
  }

  async process(input: ContainerInput): Promise<ContainerOutput> {
    if (!this.webcontainer) throw new Error('Engine not started. Call start() first.');

    // Write input to container
    await this.webcontainer.fs.writeFile('input.json', JSON.stringify(input));

    // Run the script
    const process = await this.webcontainer.spawn('node', ['input.js']);

    // Collect output
    const output: string[] = [];
    const errors: string[] = [];

    process.output.pipeTo(new WritableStream({
      write(data) {
        output.push(data);
      }
    }));

    const exitCode = await process.exit;

    let result: any = {};
    if (exitCode === 0) {
      try {
        // Parse output as JSON if script writes to stdout
        const outputStr = output.join('');
        result = JSON.parse(outputStr);
      } catch (e) {
        result = { logs: output };
      }
    } else {
      result = { errors: [...errors, ...output] };
    }

    return result as ContainerOutput;
  }

  async dispose(): Promise<void> {
    // WebContainer persists for the page session - don't dispose
    // Just clear our instance reference
    this.webcontainer = null;
    // Don't reset booted - WebContainer stays available
  }
}