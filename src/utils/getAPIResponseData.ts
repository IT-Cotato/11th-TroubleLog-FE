import instance from "../api/axios";
import type { AxiosRequestConfig } from "axios";

const getAPIResponseData = async <T, D = T>(
  option: AxiosRequestConfig<D>
): Promise<T> => {
  try {
    const { data } = await instance(option);

    // 만약 data 내부에 data가 있으면 자동으로 한 단계 제거
    if (data && typeof data === "object" && "data" in data) {
      return data.data as T;
    }

    return data as T;
  } catch (e) {
    console.error("API 요청 에러:", e);
    throw e;
  }
};

export default getAPIResponseData;
