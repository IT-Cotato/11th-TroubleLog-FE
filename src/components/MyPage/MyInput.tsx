interface MyInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const MyInput = ({ label, placeholder, value, onChange }: MyInputProps) => {
  return (
    <div className="flex flex-col items-start gap-2 self-stretch w-full">
      <p className="text-head-20-semibold">{label}</p>
      <input
        className="flex h-14 py-[19px] px-[15px] items-center self-stretch rounded-lg border border-gray1 w-full"
        placeholder={placeholder}
        value={value ?? ""}
        onChange={onChange}
      />
    </div>
  );
};

export default MyInput;
