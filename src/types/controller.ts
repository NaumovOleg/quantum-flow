export type ControllerClass = { new (...args: any[]): any };
export type ControllerInstance = InstanceType<ControllerClass>;
