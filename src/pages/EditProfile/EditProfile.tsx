import { useCallback, useEffect, useState } from "react";
import CancelButton from "@/components/Button/CancelButton";
import SaveButton from "@/components/Button/SaveButton";
import MyInput from "@/components/MyPage/MyInput";
import WithdrawBox from "@/components/MyPage/WithdrawBox";
import FollowButton from "@/components/Button/FollowButton";
import { useNavigate, useParams } from "react-router-dom";
import ConfirmDeleteModal from "@/components/Modal/ConfirmDeleteModal";

interface ProfileData {
  name: string;
  sort: string;
  bio: string;
  git: string;
}

const EditProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    sort: "",
    bio: "",
    git: "",
  });

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const handleModalClose = useCallback(() => setShowWithdrawModal(false), []);
  const handleWithdrawConfirm = useCallback(() => {
    setShowWithdrawModal(false);
  }, []);

  useEffect(() => {
    const mockData = {
      name: "안수이",
      sort: "관심분야 1",
      bio: "안녕하세요. 프론트엔드 개발자입니다!",
      git: "ddd@gmail.com",
    };
    setProfile(mockData);
  }, []);

  const handleChange =
    (field: keyof ProfileData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setProfile((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  const handleSave = () => {
    console.log("저장할 데이터:", profile);
    navigate(`/user/mypage/${id}`);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="flex justify-center min-h-screen">
      <div className="flex flex-col items-end gap-14">
        <div className="flex items-start gap-[68px] pt-20">
          {/* 왼쪽 */}
          <div className="flex flex-col items-center gap-12 self-stretch">
            <img
              src="/icons/user.svg"
              alt="user"
              className="w-[288px] h-[288px]"
            />
            <div className="flex flex-col gap-[18px]">
              <FollowButton label="이미지 업로드" colorClass="bg-primary" />
              <FollowButton label="이미지 삭제" colorClass="bg-subColor1" />
            </div>
          </div>

          {/* 오른쪽 */}
          <div className="flex flex-col items-start gap-12 w-[948px]">
            <p className="text-head-48 pb-2">프로필 수정</p>
            <MyInput
              label="닉네임"
              placeholder="닉네임을 입력해주세요"
              value={profile.name}
              onChange={handleChange("name")}
            />
            <MyInput
              label="분야"
              placeholder="관심분야를 입력해주세요"
              value={profile.sort}
              onChange={handleChange("sort")}
            />
            <MyInput
              label="한 줄 소개"
              placeholder="한 줄 소개를 입력해주세요"
              value={profile.bio}
              onChange={handleChange("bio")}
            />
            <MyInput
              label="깃허브 주소"
              placeholder="깃허브 주소를 입력해주세요"
              value={profile.git}
              onChange={handleChange("git")}
            />
          </div>
        </div>

        {/* 버튼 영역 */}
        <div className="flex gap-4">
          <CancelButton onClick={handleCancel} />
          <SaveButton onClick={handleSave} label="저장" />
        </div>

        <WithdrawBox onWithdraw={() => setShowWithdrawModal(true)} />
      </div>

      {showWithdrawModal && (
        <ConfirmDeleteModal
          onClose={handleModalClose}
          onConfirm={handleWithdrawConfirm}
          title="회원 탈퇴"
          description={`정말 탈퇴하시겠습니까?\n탈퇴하시면 작성하신 내용들도 사라집니다!`}
        />
      )}
    </div>
  );
};

export default EditProfile;
