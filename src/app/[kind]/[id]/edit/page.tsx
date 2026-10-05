import { SampleNotice } from "@/components/SampleNotice";

// 記録の編集。フォームはマイルストーン3で作る(新規と同じフォームを使う)
export default function EditDrinkPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">記録を編集</h1>
      <SampleNotice>編集フォームはマイルストーン3で作ります。左上の矢印で戻れます。</SampleNotice>
    </div>
  );
}
