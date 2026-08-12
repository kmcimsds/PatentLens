import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      // pptxgenjs는 Node 실행 경로에서만 쓰는 모듈을 참조한다. 패키지에 browser 필드가
      // 있지만 exports 필드가 우선이라 무시되고, webpack은 node: 스킴을 해석하지 못해
      // 클라이언트 빌드가 깨진다. 해당 참조만 빈 모듈로 치환한다.
      const stub = path.resolve(process.cwd(), "lib/node-builtin-stub.js");

      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^node:(fs|https|os|path)$/,
          (resource: { request: string }) => {
            resource.request = stub;
          }
        )
      );

      config.resolve.alias = {
        ...config.resolve.alias,
        "image-size": false,
      };
    }

    return config;
  },
};

export default nextConfig;
