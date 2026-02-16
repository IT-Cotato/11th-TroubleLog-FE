import { Component, type ErrorInfo, type ReactNode } from "react";

export interface ErrorBoundaryProps {
  children: ReactNode;
  /** 에러 시 대체 UI (미제공 시 기본 fallback) */
  fallback?: ReactNode;
  /** 에러 발생 시 콜백 (로깅 등) */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * 하위 트리에서 발생한 에러를 잡아 fallback을 렌더링하는 에러 바운더리
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.props.onError?.(error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          className="flex flex-col items-center justify-center gap-4 p-8 text-center"
          role="alert"
        >
          <p className="text-body-16-regular text-red-600">
            일시적인 오류가 발생했어요.
          </p>
          <p className="text-body-14-regular text-gray-500">
            {this.state.error.message}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
