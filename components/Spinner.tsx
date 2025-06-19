interface SpinnerProps {
  size?: "small" | "default" | "large";
  fullScreen?: boolean;
}

function Spinner({ size = "default", fullScreen = false }: SpinnerProps) {
  const sizeClasses = {
    small: "w-4 h-4",
    default: "w-8 h-8",
    large: "w-12 h-12"
  };

  const containerClass = fullScreen 
    ? "min-h-screen bg-gray-50 flex items-center justify-center"
    : "flex justify-center items-center min-h-[200px]";

  return (
    <div className={containerClass}>
      <div className={`${sizeClasses[size]} border-4 border-blue-600 border-t-transparent rounded-full animate-spin`} />
    </div>
  );
}

export default Spinner;
