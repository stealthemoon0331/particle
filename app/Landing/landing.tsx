import { useEffect, useRef, useState } from "react";
import { MicrofiberStarModel } from "~/components/MicrofiberStarModel";
import ProductPreview from "~/components/ProductPreview";

export function Landing() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const content1Ref = useRef<HTMLDivElement>(null);
  const content2Ref = useRef<HTMLDivElement>(null);

  const [showContent1, setShowContent1] = useState(true);
  const [showContent2, setShowContent2] = useState(false);

  const productItems = [
    { name: "Flat Mop", url: "/preview.png" },
    { name: "Rolling Mop", url: "/rolling.png" },
    { name: "Scrubber Mop", url: "/scrubber.png" },
    { name: "Squeegee Mop", url: "/squeegee.png" },
    { name: "Dusting Wand", url: "/dusting.png" },
  ];

  const [previewUrl, setPreviewUrl] = useState("/preview.png");

  const selectProduct = (url: string) => {
    setPreviewUrl(url);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current || !content1Ref.current || !content2Ref.current)
        return;

      const scrollTop = scrollRef.current.scrollTop;
      const content2Top = content2Ref.current.offsetTop;

      setShowContent1(scrollTop < content2Top - 150);
      setShowContent2(scrollTop >= content2Top - 150);
    };

    const scrollContainer = scrollRef.current;
    scrollContainer?.addEventListener("scroll", handleScroll);

    return () => {
      scrollContainer?.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <main className="flex flex-col items-center justify-center pt-4 gap-8 px-4 md:px-10 lg:px-40 bg-[#00001a] text-white h-screen">
      <div className="flex justify-end w-full min-h-0 mb-8">
        <header className="flex flex-wrap items-center gap-4 md:gap-6 text-xs">
          <a>HOME</a>
          <a>EXPERTISE</a>
          <a>INNOVATION</a>
          <a>MARKETS</a>
          <a>ABOUT</a>
        </header>
      </div>
      <section className="hero flex flex-col lg:flex-row w-full relative">
        <div
          ref={scrollRef}
          className="flex flex-col w-full lg:w-1/2 px-4 md:px-8 lg:px-20 absolute h-full overflow-y-auto no-scrollbar"
          style={{ scrollBehavior: "smooth" }}
        >
          {/* Content 1 */}
          <div
            ref={content1Ref}
            className={`transition-opacity duration-500 ${
              showContent1 ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-[#00001a] z-10 pt-4">
              We are Microfiber
            </h1>
            <h2 className="text-xl md:text-2xl lg:text-3xl mb-4">
              We are Concept Manufacturing
            </h2>
            <span className="text-base md:text-lg mb-6 block">
              From custom product development to private-label manufacturing,
              <br />
              we deliver innovative microfiber cleaning solutions that are
              expertly crafted and scientifically tested.
            </span>
          </div>

          {/* Content 2 */}
          <div
            ref={content2Ref}
            className={`transition-opacity duration-500 ${
              showContent2 ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <h2 className="text-2xl md:text-3xl mb-4">INNOVATION GALLERY</h2>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 flex-1">
                {productItems.map((product, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center text-center p-2 cursor-pointer"
                    onClick={() => selectProduct(product.url)}
                  >
                    <img
                      src={product.url}
                      alt={product.name}
                      className="w-full h-36 sm:h-48 object-cover mb-2"
                    />
                    <div className="text-sm font-medium">{product.name}</div>
                  </div>
                ))}
              </div>
              <div className="flex-1 hidden lg:block">
                <ProductPreview url={previewUrl} />
              </div>
            </div>
          </div>
        </div>

        {/* 3D Model - Take full width on mobile */}
        <div className="w-full me:w-1/2 h-full">
          <MicrofiberStarModel />
        </div>
      </section>
    </main>
  );
}
