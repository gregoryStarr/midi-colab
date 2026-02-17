import { WebContainer } from '@webcontainer/api';
import type { ContainerInput, ContainerOutput, ScriptConfig } from './types';

/**
 * Manages the WebContainer instance for running isolated Node.js code.
 * 
 * The WebContainerEngine is responsible for booting the WebContainer,
 * installing dependencies, and executing user-provided scripts for
 * MIDI processing. It implements the singleton pattern to decouple
 * the engine instance from React component lifecycles, ensuring
 * persistence across hot reloads.
 */
export class WebContainerEngine {
  private static instance: WebContainerEngine | null = null;
  private webcontainer: WebContainer | null = null;

  /**
   * Retrieves the singleton instance of the WebContainerEngine.
   * Checks for an existing instance on the window object to support
   * persistence during development hot reloads.
   * 
   * @returns The WebContainerEngine instance.
   */
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

  /**
   * Boots the WebContainer and sets up the file system.
   * Installs necessary dependencies (e.g., 'tonal') and marks the engine as started.
   * Prevents multiple boot sequences within the same page session.
   */
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

  /**
   * Writes a user script to the container's file system.
   * 
   * @param config Configuration containing the script code.
   * @throws Error if the engine has not been started.
   */
  async loadScript(config: ScriptConfig): Promise<void> {
    if (!this.webcontainer) throw new Error('Engine not started. Call start() first.');

    await this.webcontainer.fs.writeFile('input.js', config.code);
  }

  /**
   * Executes the loaded script with the provided input.
   * Writes input to 'input.json', spawns a Node.js process to run 'input.js',
   * and parses the output from stdout.
   * 
   * @param input The data to process.
   * @returns The processed output or error logs.
   * @throws Error if the engine has not been started.
   */
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

  /**
   * Cleans up resources.
   * Note: The underlying WebContainer instance persists for the page session,
   * so this method primarily clears the internal reference.
   */
  async dispose(): Promise<void> {
    // WebContainer persists for the page session - don't dispose
    // Just clear our instance reference
    this.webcontainer = null;
    // Don't reset booted - WebContainer stays available
  }
}