'use client'

import { useCallback, useEffect, useState } from 'react'
import { generateUMLAction } from '@/actions/uml.action'
import UMLViewer from '@/components/UMLViewer'
import {
	DEFAULT_DIAGRAM_TYPE,
	DIAGRAM_TYPES,
	templates,
} from '@/constants'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
	Check,
	Code,
	Copy,
	Download,
	FileCode,
	LayoutTemplate,
	Lightbulb,
	Moon,
	RefreshCw,
	Sparkles,
	Sun,
	Zap,
} from 'lucide-react'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip'

const DEFAULT_TEMPLATE = templates[DEFAULT_DIAGRAM_TYPE] ?? ''

export default function UMLGenerator() {
	const [description, setDescription] = useState('')
	const [umlCode, setUmlCode] = useState(DEFAULT_TEMPLATE)
	const [diagramType, setDiagramType] = useState(DEFAULT_DIAGRAM_TYPE)
	const [isGenerating, setIsGenerating] = useState(false)
	const [isRefreshing, setIsRefreshing] = useState(false)
	const [isDarkMode, setIsDarkMode] = useState(false)
	const [activeTab, setActiveTab] = useState('split')
	const [image, setImage] = useState('')
	const [isCopied, setIsCopied] = useState(false)
	const [refreshNonce, setRefreshNonce] = useState(0)

	useEffect(() => {
		const initialTemplate = templates[DEFAULT_DIAGRAM_TYPE]
		if (initialTemplate) {
			setUmlCode(initialTemplate)
		}
	}, [])

	useEffect(() => {
		if (isDarkMode) {
			document.documentElement.classList.add('dark')
		} else {
			document.documentElement.classList.remove('dark')
		}
	}, [isDarkMode])

	const handleTemplateChange = (type: string) => {
		setDiagramType(type)
		const nextTemplate = templates[type]
		if (nextTemplate) {
			setUmlCode(nextTemplate)
		}
		setImage('')
		setIsRefreshing(true)
		setRefreshNonce(Date.now())
	}

	const handleManualUpdate = () => {
		if (!umlCode.trim()) return
		setImage('')
		setIsRefreshing(true)
		setRefreshNonce(Date.now())
	}

	const handleImageGenerate = useCallback((url: string) => {
		setImage(url)
		setIsRefreshing(false)
	}, [])

	const generateUML = async () => {
		if (!description.trim()) return
		try {
			setIsGenerating(true)
			setIsRefreshing(true)
			const uml = (await generateUMLAction(description, diagramType)) as string
			if (uml) {
				setUmlCode(uml)
				setRefreshNonce(Date.now())
			} else {
				setIsRefreshing(false)
			}
		} catch (error) {
			console.error(error)
			alert('Something went wrong/Out of credits')
			setIsRefreshing(false)
		} finally {
			setIsGenerating(false)
		}
	}

	const handleCopy = () => {
		setIsCopied(true)
		navigator.clipboard.writeText(umlCode)
		setTimeout(() => {
			setIsCopied(false)
		}, 2000)
	}

	const handleDownload = async () => {
		try {
			const response = await fetch(image)
			if (!response.ok) {
				throw new Error('Failed to fetch the SVG content')
			}
			const svgBlob = await response.blob()
			const url = URL.createObjectURL(svgBlob)
			const link = document.createElement('a')
			link.href = url
			link.download = 'uml.svg'
			document.body.appendChild(link)
			link.click()
			URL.revokeObjectURL(url)
			document.body.removeChild(link)
		} catch (error) {
			console.error('Error downloading the SVG:', error)
		}
	}

	const isBusy = isGenerating || isRefreshing

	const renderUML = () => (
		<UMLViewer
			umlCode={umlCode}
			isGenerating={isBusy}
			imageUrl={image || undefined}
			onImageGenerate={handleImageGenerate}
			refreshNonce={refreshNonce}
		/>
	)

	return (
		<div className="min-h-screen bg-background text-foreground">
			<header className="border-b">
				<div className="container mx-auto px-4 py-3 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<FileCode className="h-6 w-6 text-primary" />
						<h1 className="text-xl font-bold">AI UML Generator</h1>
						<Badge variant="outline" className="ml-2">
							Beta
						</Badge>
					</div>
					<div className="flex items-center gap-4">
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<div className="flex items-center gap-2">
										<Switch
											checked={isDarkMode}
											onCheckedChange={setIsDarkMode}
											id="dark-mode"
										/>
										<Label htmlFor="dark-mode" className="cursor-pointer">
											{isDarkMode ? (
												<Moon className="h-4 w-4" />
											) : (
												<Sun className="h-4 w-4" />
											)}
										</Label>
									</div>
								</TooltipTrigger>
								<TooltipContent>
									<p>Toggle dark mode</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
				</div>
			</header>

			<main className="container mx-auto px-4 py-6">
				<div className="mb-6">
					<Card>
						<CardContent className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between p-4">
							<div className="flex items-center gap-2">
								<Lightbulb className="h-5 w-5 text-primary" />
								<h2 className="text-base font-semibold">Tips</h2>
							</div>
							<ul className="text-sm text-muted-foreground grid gap-1 md:grid-cols-2 md:gap-x-4 md:gap-y-1">
								<li>• Ask for the diagram you need, then refine.</li>
								<li>• Reference existing elements when requesting edits.</li>
								<li>• Switch templates to explore different UML types.</li>
								<li>• Edit PlantUML directly and refresh the preview.</li>
							</ul>
						</CardContent>
					</Card>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-[1.2fr_2.8fr] gap-6">
					{/* Sidebar */}
					<div>
						<Card>
							<CardContent className="p-4 space-y-6">
								<div>
									<h3 className="text-lg font-medium mb-2 flex items-center gap-2">
										<LayoutTemplate className="h-4 w-4 text-primary" />
										Templates
									</h3>
									<Select value={diagramType} onValueChange={handleTemplateChange}>
										<SelectTrigger>
											<SelectValue placeholder="Select template" />
										</SelectTrigger>
										<SelectContent>
											{DIAGRAM_TYPES.map(option => (
												<SelectItem key={option.value} value={option.value}>
													{option.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<Separator />

								<div>
									<h3 className="text-lg font-medium mb-2 flex items-center gap-2">
										<Sparkles className="h-4 w-4 text-primary" />
										UML Chat Assistant
									</h3>
									<div className="space-y-3">
										<Textarea
											placeholder="Describe your system or the change you want..."
											value={description}
											onChange={e => setDescription(e.target.value)}
											className="min-h-[140px]"
										/>
										<Button
											onClick={generateUML}
											className="w-full"
											disabled={isGenerating || !description.trim()}
										>
											{isGenerating ? (
												<>
													<RefreshCw className="mr-2 h-4 w-4 animate-spin" />
													Generating...
												</>
											) : (
												<>
													<Zap className="mr-2 h-4 w-4" />
													Generate UML
												</>
											)}
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Main content */}
					<div>
						<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
							<div className="flex flex-wrap justify-between items-center gap-3 mb-4">
								<TabsList>
									<TabsTrigger value="editor" className="flex items-center gap-2">
										<Code className="h-4 w-4" />
										Editor
									</TabsTrigger>
									<TabsTrigger value="preview" className="flex items-center gap-2">
										<FileCode className="h-4 w-4" />
										Preview
									</TabsTrigger>
									<TabsTrigger value="split" className="flex items-center gap-2">
										<LayoutTemplate className="h-4 w-4" />
										Split View
									</TabsTrigger>
								</TabsList>

								<div className="flex items-center gap-2">
									<Button
										onClick={handleManualUpdate}
										variant="default"
										size="sm"
										disabled={!umlCode.trim() || isBusy}
									>
										{isRefreshing ? (
											<>
												<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
												Updating...
											</>
										) : (
											<>
												<RefreshCw className="h-4 w-4 mr-2" />
												Update Diagram
											</>
										)}
									</Button>
									<Button onClick={handleCopy} variant="outline" size="sm">
										{isCopied ? (
											<Check className="h-4 w-4 mr-2" />
										) : (
											<Copy className="h-4 w-4 mr-2" />
										)}
										Copy
									</Button>
									<Button
										onClick={handleDownload}
										variant="outline"
										size="sm"
										disabled={!image}
									>
										<Download className="h-4 w-4 mr-2" />
										Export
									</Button>
								</div>
							</div>

							<TabsContent value="editor" className="mt-0">
								<Card>
									<CardContent className="p-0">
										<div className="border rounded-md">
											<div className="bg-muted/50 p-2 border-b flex items-center justify-between">
												<div className="text-sm font-medium">PlantUML Code</div>
												<div className="text-xs text-muted-foreground">
													Syntax: PlantUML
												</div>
											</div>
											<div className="p-4 font-mono text-sm h-[70vh] overflow-auto">
												<Textarea
													value={umlCode}
													onChange={e => setUmlCode(e.target.value)}
													className="font-mono h-full border-0 focus-visible:ring-0 resize-none"
												/>
											</div>
										</div>
									</CardContent>
								</Card>
							</TabsContent>

							<TabsContent value="preview" className="mt-0">
								<Card>
									<CardContent className="p-0">
										<div className="border rounded-md">
											<div className="bg-muted/50 p-2 border-b flex items-center justify-between">
												<div className="text-sm font-medium">
													Diagram Preview
												</div>
												<div className="text-xs text-muted-foreground">
													{isBusy ? 'Generating...' : 'Ready'}
												</div>
											</div>
											<div className="h-[70vh] overflow-auto">{renderUML()}</div>
										</div>
									</CardContent>
								</Card>
							</TabsContent>

							<TabsContent value="split" className="mt-0">
								<div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-4">
									<Card>
										<CardContent className="p-0">
											<div className="border rounded-md">
												<div className="bg-muted/50 p-2 border-b flex items-center justify-between">
													<div className="text-sm font-medium">
														PlantUML Code
													</div>
													<div className="text-xs text-muted-foreground">
														Syntax: PlantUML
													</div>
												</div>
												<div className="p-4 font-mono text-sm h-[70vh] overflow-auto">
													<Textarea
														value={umlCode}
														onChange={e => setUmlCode(e.target.value)}
														className="font-mono h-full border-0 focus-visible:ring-0 resize-none"
													/>
												</div>
											</div>
										</CardContent>
									</Card>

									<Card>
										<CardContent className="p-0">
											<div className="border rounded-md">
												<div className="bg-muted/50 p-2 border-b flex items-center justify-between">
													<div className="text-sm font-medium">
														Diagram Preview
													</div>
													<div className="text-xs text-muted-foreground">
														{isBusy ? 'Generating...' : 'Ready'}
													</div>
												</div>
												<div className="h-[70vh] border overflow-auto">
													{renderUML()}
												</div>
											</div>
										</CardContent>
									</Card>
								</div>
							</TabsContent>
						</Tabs>
					</div>
				</div>
			</main>
		</div>
	)
}
