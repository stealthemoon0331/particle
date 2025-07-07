import { useEffect, useRef, useState } from "react";
import MicrofiberStarModel from "~/components/MicrofiberStarModel/index";
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
    console.log("scrollRef.current => ", scrollRef.current);
    const onScroll = () => {
      if (!scrollRef.current) return;

      const scrollTop = scrollRef.current.scrollTop;
      const scrollHeight = scrollRef.current.scrollHeight;
      const clientHeight = scrollRef.current.clientHeight;

      console.log("scrollTop => ", scrollTop);
      console.log("clientHeight => ", clientHeight);

      // Example threshold: halfway down switches to content2
      if (scrollTop > clientHeight * 0.25) {
        setShowContent1(false);
        setShowContent2(true);
      } else {
        setShowContent1(true);
        setShowContent2(false);
      }
    };

    const current = scrollRef.current;
    if (current) {
      current.addEventListener("scroll", onScroll);
    }

    return () => {
      if (current) {
        current.removeEventListener("scroll", onScroll);
      }
    };
  }, []);

  return (
    <main className="relative bg-[#00001a] text-white h-screen overflow-hidden">
      {/* 3D Model Background */}
      <div className="absolute inset-0 z-0">
        <MicrofiberStarModel />
      </div>

      {/* Header */}
      <header className="absolute top-0 w-full z-10 px-4 md:px-20 lg:px-80 py-16">
        <nav className="flex flex-wrap items-center justify-end gap-4 md:gap-6 text-base">
          <a>HOME</a>
          <a>EXPERTISE</a>
          <a>INNOVATION</a>
          <a>MARKETS</a>
          <a>ABOUT</a>
        </nav>
      </header>

      {/* Foreground Content */}
      <section
        ref={scrollRef}
        className="relative z-10 h-[80vh] overflow-y-auto w-full pt-28 px-4 md:px-20 lg:px-80 no-scrollbar"
        style={{ scrollBehavior: "smooth" }}
      >
        {/* Scrollable content wrapper with enough height */}
        <div className="relative h-[200vh] w-full">
          {/* Top half: Content Block 1 */}
          <div
            ref={content1Ref}
            className={`sticky top-0 left-0 w-full transition-opacity duration-500 ${
              showContent1 ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <h1 className="text-3xl md:text-5xl lg:text-7xl font-bold mb-4">
              We are <br /> Microfiber
            </h1>
            <h2 className="text-xl md:text-3xl lg:text-5xl mb-4">
              We are Concept <br /> Manufacturing
            </h2>
            <span className="text-base md:text-xl lg:text-2xl mb-6 block max-w-3xl lg:pr-64">
              From custom product development to private-label manufacturing, we
              deliver innovative microfiber cleaning solutions that are expertly
              crafted and scientifically tested.
            </span>
          </div>

          {/* Bottom half: Content Block 2 */}
          <div
            ref={content2Ref}
            className={`sticky top-0 left-0 w-full transition-opacity duration-500 ${
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
      </section>
    </main>
  );
}
