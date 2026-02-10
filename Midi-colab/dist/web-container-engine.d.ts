import type { ContainerInput, ContainerOutput, ScriptConfig } from './types';
export declare class WebContainerEngine {
    private static instance;
    private webcontainer;
    static getInstance(): WebContainerEngine;
    private constructor();
    start(): Promise<void>;
    loadScript(config: ScriptConfig): Promise<void>;
    process(input: ContainerInput): Promise<ContainerOutput>;
    dispose(): Promise<void>;
}
//# sourceMappingURL=web-container-engine.d.ts.map