import { useCallback, useEffect, useState, useRef } from "react";
import CancelButton from "@/components/Button/CancelButton";
import SaveButton from "@/components/Button/SaveButton";
import MyInput from "@/components/MyPage/MyInput";
import WithdrawBox from "@/components/MyPage/WithdrawBox";
import FollowButton from "@/components/Button/FollowButton";
import { useNavigate, useParams } from "react-router-dom";
import ConfirmDeleteModal from "@/components/Modal/ConfirmDeleteModal";
import WithdrawCompleteModal from "@/components/Modal/WithdrawCompleteModal";
import type { ProfileData, UpdatedProfileData } from "@/models/user.model";
import {
  deleteUser,
  getMyProfile,
  getUserInfo,
  patchProfile,
} from "@/api/user.api";
import { PATH } from "@/constants/paths";
import userIcon from "@/assets/icons/user.svg";
import useImageUpload from "@/utils/useImageUpload";

const EditProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { upload } = useImageUpload();

  const [profile, setProfile] = useState<UpdatedProfileData>({
    userId: 0,
    nickname: "",
    field: "",
    bio: "",
    githubUrl: "",
    profileUrl: "",
  });

  // 프로필 이미지 미리보기
  const [profileImage, setProfileImage] = useState<string>(userIcon);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 이미지 삭제 가능 여부 판단
  const canDeleteImage =
    !!profile.profileUrl || (profileImage && profileImage !== userIcon);

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      // 서버 업로드
      const uploadedUrl = await upload(file);

      // UI 미리보기
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setProfileImage(reader.result);
        }
      };
      reader.readAsDataURL(file);

      // 프로필 state에 서버 URL 저장
      setProfile((prev) => ({
        ...prev,
        profileUrl: uploadedUrl,
      }));
    } catch (err) {
      console.error("이미지 업로드 실패", err);
    }
  };

  const handleImageDelete = () => {
    setProfileImage(userIcon);
    setProfile((prev) => ({
      ...prev,
      profileUrl: "",
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 회원 탈퇴
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showWithdrawCompleteModal, setShowWithdrawCompleteModal] =
    useState(false);

  const handleWithdrawClose = useCallback(() => {
    setShowWithdrawModal(false);
  }, []);

  const handleWithdrawConfirm = useCallback(async () => {
    try {
      await deleteUser();
      setShowWithdrawModal(false);
      setShowWithdrawCompleteModal(true);
    } catch (error) {
      console.error("회원 탈퇴 실패:", error);
    }
  }, []);

  const handleWithdrawComplete = useCallback(() => {
    setShowWithdrawCompleteModal(false);
    navigate("/");
  }, [navigate]);

  // 프로필 불러오기
  useEffect(() => {
    let alive = true;

    const fetchProfile = async () => {
      try {
        const [me, userInfo] = await Promise.all([
          getMyProfile(),
          id ? getUserInfo(Number(id)) : Promise.resolve(null as any),
        ]);

        // 사용자 정보 API가 제공하는 profileUrl 우선 사용
        const serverProfileUrl =
          (userInfo && userInfo.profileUrl) ||
          (me as any)?.profileUrl || // 혹시 백엔드가 주는 경우
          "";

        if (!alive) return;

        setProfile({
          userId: me.userId,
          nickname: me.nickname,
          field: me.field,
          bio: me.bio,
          githubUrl: me.githubUrl,
          profileUrl: serverProfileUrl,
        });

        // 미리보기에도 반영
        setProfileImage(serverProfileUrl || userIcon);
      } catch (error) {
        console.error("정보를 불러오는 데 실패했습니다", error);
      }
    };

    fetchProfile();
    return () => {
      alive = false;
    };
  }, [id]);

  const handleChange =
    (field: keyof ProfileData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setProfile((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  // 저장
  const handleSave = async () => {
    const nickname = profile.nickname?.trim() || "";
    const field = profile.field?.trim() || "";
    const bio = profile.bio?.trim() || "";

    if (!nickname || !field || !bio) {
      alert("닉네임, 분야, 한 줄 소개는 필수 입력 항목입니다.");
      return;
    }

    try {
      console.log(profile);
      await patchProfile(profile);
      navigate(PATH.MYPAGE(id!));
    } catch (error) {
      console.error("프로필 수정 실패:", error);
    }
  };

  // 취소
  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="flex justify-center min-h-screen pb-6">
      <div className="flex flex-col items-end gap-14 w-3/4">
        <div className="flex items-start gap-16 pt-20 w-full">
          {/* 왼쪽 */}
          <div className="flex flex-col items-center gap-12 self-stretch">
            <img
              src={profileImage}
              alt="user"
              className="w-72 h-72 object-cover rounded-full"
            />

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleImageChange}
            />

            <div className="flex flex-col gap-[18px]">
              <FollowButton
                label="이미지 업로드"
                colorClass="bg-primary"
                onClick={handleImageUpload}
              />
              <FollowButton
                label="이미지 삭제"
                colorClass={
                  canDeleteImage
                    ? "bg-primary"
                    : "bg-subColor1 cursor-not-allowed"
                }
                onClick={canDeleteImage ? handleImageDelete : undefined}
              />
            </div>
          </div>

          {/* 오른쪽 */}
          <div className="flex flex-col items-start gap-12 w-3/4">
            <p className="text-head-48 pb-2">프로필 수정</p>
            <MyInput
              label="닉네임"
              placeholder="닉네임을 입력해주세요"
              value={profile.nickname}
              onChange={handleChange("nickname")}
            />
            <MyInput
              label="분야"
              placeholder="관심분야를 입력해주세요"
              value={profile.field}
              onChange={handleChange("field")}
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
              value={profile.githubUrl}
              onChange={handleChange("githubUrl")}
            />
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-4">
          <CancelButton onClick={handleCancel} />
          <SaveButton onClick={handleSave} label="저장" />
        </div>

        <WithdrawBox onWithdraw={() => setShowWithdrawModal(true)} />
      </div>

      {showWithdrawModal && (
        <ConfirmDeleteModal
          onClose={handleWithdrawClose}
          onConfirm={handleWithdrawConfirm}
          title="회원 탈퇴"
          description={`정말 탈퇴하시겠습니까?\n탈퇴하시면 작성하신 내용들도 사라집니다!`}
          label="탈퇴"
        />
      )}

      {showWithdrawCompleteModal && (
        <WithdrawCompleteModal onClose={handleWithdrawComplete} />
      )}
    </div>
  );
};

export default EditProfile;
