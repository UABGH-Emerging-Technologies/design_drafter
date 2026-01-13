'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, RotateCw, ZoomIn, ZoomOut } from 'lucide-react'
import plantumlEncoder from 'plantuml-encoder'
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'

type UMLViewerProps = {
	umlCode: string
	isGenerating: boolean
	imageUrl?: string
	onImageGenerate?: (url: string) => void
	refreshNonce?: number
}

const UMLViewer = ({
	umlCode,
	isGenerating,
	imageUrl,
	onImageGenerate,
	refreshNonce,
}: UMLViewerProps) => {
	const [generatedImage, setGeneratedImage] = useState('')

	useEffect(() => {
		async function generateUML() {
			if (!umlCode) {
				setGeneratedImage('')
				onImageGenerate?.('')
				return
			}

			const encodedUML = plantumlEncoder.encode(umlCode)
			const plantUMLServer = 'https://www.plantuml.com/plantuml/svg/'
			const url = plantUMLServer + encodedUML
			setGeneratedImage(url)
			onImageGenerate?.(url)
		}

		generateUML()
	}, [umlCode, onImageGenerate, refreshNonce])

	const previewSrc = imageUrl || generatedImage

	try {
		return (
			<div className="flex flex-col h-full min-h-[60vh] w-full bg-muted/30 rounded-md p-4">
				{isGenerating ? (
					<div className="flex flex-col items-center justify-center gap-2 h-full">
						<RefreshCw className="animate-spin h-8 w-8" />
						<p>Generating diagram...</p>
					</div>
				) : (
					<TransformWrapper
						smooth
						initialScale={0.9}
						minScale={0.2}
						maxScale={4}
						centerOnInit
					>
						{({ zoomIn, zoomOut, resetTransform }) => (
							<>
								<div className="flex gap-2 mb-2 self-end">
									<button
										onClick={() => zoomIn()}
										className="p-2 bg-secondary text-secondary-foreground rounded-md"
									>
										<ZoomIn />
									</button>
									<button
										onClick={() => zoomOut()}
										className="p-2 bg-secondary text-secondary-foreground rounded-md"
									>
										<ZoomOut />
									</button>
									<button
										onClick={() => resetTransform()}
										className="p-2 bg-secondary text-secondary-foreground rounded-md"
									>
										<RotateCw />
									</button>
								</div>

								<TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
									<div className="w-full h-full overflow-auto flex items-center justify-center">
										{previewSrc ? (
											<img
												src={previewSrc}
												alt="UML Diagram Preview"
												className="w-full h-auto object-contain"
												loading="lazy"
											/>
										) : (
											<p>No diagram available</p>
										)}
									</div>
								</TransformComponent>
							</>
						)}
					</TransformWrapper>
				)}
			</div>
		)
	} catch (error) {
		console.error('Error rendering UML:', error)
		return (
			<div className="flex items-center justify-center h-full bg-muted/30 rounded-md p-4">
				<div className="text-center text-muted-foreground">
					<p>Error generating diagram</p>
				</div>
			</div>
		)
	}
}

export default UMLViewer
