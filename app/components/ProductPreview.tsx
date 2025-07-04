interface ProductPreviewProps {
    url: string;
}

const ProductPreview = ({url} : ProductPreviewProps) => {
    
    
    return (
        <>
            <div className="text-center">
                <img src={url} className="h-full w-full"/>
            </div>
            <div className="controls">
                
            </div>
        </>
    )
}

export default ProductPreview;