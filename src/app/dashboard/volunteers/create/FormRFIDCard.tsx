
const FormRFIDCard = () => {
    return (
        <div className="relative w-[190px] h-[254px] bg-transparent shadow-md overflow-hidden rounded-[10px] group hover:shadow-lg transition-shadow duration-300">
            <div className="cursor-default w-full h-full relative z-10 flex items-center justify-center text-[34px] uppercase tracking-wider text-[#212121] bg-white/10 border border-white/20 backdrop-blur-[20px] rounded-[10px] transition-all duration-300">
                Id card
            </div>

            {/* Elemento ::after */}
            <div className="absolute w-[100px] h-[100px] bg-purple-400 rounded-full top-[-20px] left-[-20px] transition-all duration-500 animate-animFirst group-hover:left-[80px] group-hover:scale-125"></div>

            {/* Elemento ::before */}
            <div className="absolute w-[100px] h-[100px] bg-blue-400 rounded-full top-[70%] left-[70%] transition-all duration-500 animate-animSecond group-hover:left-[-10px] group-hover:scale-125"></div>
        </div>

    )
}

export default FormRFIDCard