export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class CycleDetectorNotImplementedError extends AppError {
  constructor() {
    super(
      501,
      'CYCLE_DETECTOR_NOT_IMPLEMENTED',
      'Circular-dependency detection must be implemented before movie writes are enabled.',
    );
  }
}

export class BundleOptimizerNotImplementedError extends AppError {
  constructor() {
    super(
      501,
      'BUNDLE_OPTIMIZER_NOT_IMPLEMENTED',
      'Minimum-bundle optimization must be implemented before booking quotes are enabled.',
    );
  }
}
