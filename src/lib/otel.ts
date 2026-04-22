import { logger } from './logger';

// Minimal OTel stub.
// 실제 계측이 필요하면 아래 패키지를 설치하고 이 파일을 교체하세요:
// npm install @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node

export function startOtel(): void {
  logger.info('[OTEL] instrumentation initialized (stub)');
}

export async function shutdownOtel(): Promise<void> {
  logger.info('[OTEL] shutdown');
}
