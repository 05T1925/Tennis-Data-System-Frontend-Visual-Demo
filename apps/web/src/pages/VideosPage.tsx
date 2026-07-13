import { Link } from 'react-router-dom';

import { PageIntro } from '../components/PageIntro';

export function VideosPage() {
  return (
    <>
      <PageIntro title="视频" description="视频列表与上传数据尚未实现。" />
      <Link className="primary-link" to="/videos/demo-video">
        验证视频参数路由
      </Link>
    </>
  );
}
