import instance from "@/api/axios";
import type { AxiosRequestConfig, AxiosResponse, AxiosPromise } from "axios";

// 오버로딩 시그니처
async function getAPIResponseData<T, D = any>(
  config: AxiosRequestConfig<D>
): Promise<T>;
async function getAPIResponseData<T>(promise: AxiosPromise<T>): Promise<T>;

async function getAPIResponseData<T, D = any>(
  arg: AxiosRequestConfig<D> | AxiosPromise<T>
): Promise<T> {
  try {
    let res: AxiosResponse<T>;
    if (typeof (arg as AxiosPromise<T>).then === "function") {
      res = await (arg as AxiosPromise<T>);
    } else {
      res = await instance(arg as AxiosRequestConfig<D>);
    }
    const { data, status } = res;

    // 204 No Content
    if (status === 204) {
      // T가 null을 허용하는지 확인
      return null as T;
    }

    // ApiResponse<T> 형태면 data.data 반환
    if (data && typeof data === "object" && "data" in data) {
      return (data as any).data as T;
    }

    return data as T;
  } catch (error) {
    console.error("API 요청 에러:", error);
    throw error;
  }
}

export default getAPIResponseData;
