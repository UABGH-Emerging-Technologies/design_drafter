'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
	Download,
	Copy,
	Code,
	FileCode,
	Sparkles,
	RefreshCw,
	Zap,
	Lightbulb,
	LayoutTemplate,
	Moon,
	Sun,
	Check,
} from 'lucide-react'

import { DIAGRAM_TEMPLATES, DIAGRAM_TYPES, DEFAULT_DIAGRAM_TYPE } from '@/constants'
import { generateUMLAction } from '@/actions/uml.action'
import UMLViewer from '@/components/UMLViewer'

type ChatMessage = {
	id: string
	role: 'user' | 'assistant' | 'system' | 'error'
	content: string
}

const createMessageId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const MAX_HISTORY_MESSAGES = 10

const summarizeChatHistory = (history: ChatMessage[]) => {
	const relevant = history.slice(-MAX_HISTORY_MESSAGES)
	return relevant
		.map(msg => {
			const label =
				msg.role === 'user'
					? 'User'
					: msg.role === 'assistant'
						? 'Assistant'
						: msg.role === 'error'
							? 'Error'
							: 'System'
			return `${label}: ${msg.content}`
		})
		.join('\n')
}

const extractPlantUmlBlock = (code: string | null | undefined) => {
	if (!code) return null
	const match = code.match(/@startuml[\s\S]*@enduml/i)
	return match ? match[0] : null
}

const buildPromptDescription = ({
	diagramType,
	currentCode,
	chatSummary,
	latestRequest,
}: {
	diagramType: string
	currentCode: string
	chatSummary: string
	latestRequest: string
}) => {
	const instructions = [
		'You are an expert UML assistant.',
		`Always return valid PlantUML code for a ${diagramType} diagram, enclosed between @startuml and @enduml.`,
		'Do not include explanations, markdown fences, or commentary—only PlantUML.',
	]

	const currentSection = currentCode
		? `Current PlantUML diagram:\n${currentCode}\n`
		: 'No diagram has been created yet.'

	const historySection = chatSummary ? `Recent conversation:\n${chatSummary}\n` : ''

	return [
		instructions.join(' '),
		currentSection,
		historySection,
		`Latest user request:\n${latestRequest}`,
		'Update the PlantUML diagram to satisfy the latest request while preserving relevant structure.',
	].join('\n\n')
}

export default function UMLGenerator() {
	const [chatInput, setChatInput] = useState('')
	const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
	const [diagramType, setDiagramType] = useState(DEFAULT_DIAGRAM_TYPE)
	const [umlCode, setUmlCode] = useState(DIAGRAM_TEMPLATES[DEFAULT_DIAGRAM_TYPE] ?? '')
	const [isGenerating, setIsGenerating] = useState(false)
	const [isRefreshing, setIsRefreshing] = useState(false)
	const [isDarkMode, setIsDarkMode] = useState(false)
	const [activeTab, setActiveTab] = useState('split')
	const editorRef = useRef<HTMLDivElement>(null)
	const [image, setImage] = useState('')
	const [isCopied, setIsCopied] = useState(false)
	const [errorMsg, setErrorMsg] = useState<string | null>(null)

	// Toggle dark mode
	useEffect(() => {
		if (isDarkMode) {
			document.documentElement.classList.add('dark')
		} else {
			document.documentElement.classList.remove('dark')
		}
	}, [isDarkMode])

	const handleSendMessage = async () => {
		const trimmedInput = chatInput.trim()
		if (!trimmedInput) return

		const userMessage: ChatMessage = {
			id: createMessageId(),
			role: 'user',
			content: trimmedInput,
		}

		const pendingHistory = [...chatHistory, userMessage]
		setChatHistory(pendingHistory)
		setChatInput('')

		try {
			setIsGenerating(true)
			setErrorMsg(null)
			setImage('')

			const historyPrompt = summarizeChatHistory(pendingHistory)
			const composedDescription = buildPromptDescription({
				diagramType,
				currentCode: umlCode,
				chatSummary: historyPrompt,
				latestRequest: trimmedInput,
			})

			const result = await generateUMLAction(composedDescription, diagramType)
			if (result.status === 'ok') {
				const normalizedCode = extractPlantUmlBlock(result.plantuml_code) ?? umlCode
				if (normalizedCode && normalizedCode !== umlCode) {
					setUmlCode(normalizedCode)
				}
				if (result.image_base64) {
					setImage(`data:image/png;base64,${result.image_base64}`)
				} else if (result.image_url) {
					setImage(result.image_url)
				} else {
					setImage('')
				}
				setIsRefreshing(false)
				setChatHistory(prev => [
					...prev,
					{
						id: createMessageId(),
						role: 'assistant',
						content: result.message || 'Diagram updated. Share your next change request!',
					},
				])
				setErrorMsg(null)
			} else {
				const failureMsg = result.message || 'Failed to generate UML diagram'
				setErrorMsg(failureMsg)
				setChatHistory(prev => [
					...prev,
					{ id: createMessageId(), role: 'error', content: failureMsg },
				])
			}
		} catch (error: unknown) {
			console.error(error)
			const message =
				error instanceof Error
					? error.message || 'Something went wrong/Out of credits'
					: 'Something went wrong/Out of credits'
			setErrorMsg(message)
			setChatHistory(prev => [
				...prev,
				{ id: createMessageId(), role: 'error', content: message },
			])
		} finally {
			setIsGenerating(false)
		}
	}

	// Render helpers
	const renderUML = () => {
		if (errorMsg) {
			return (
				<div className="flex items-center justify-center h-full text-destructive">
					{errorMsg}
				</div>
			)
		}
		return (
			<UMLViewer
				umlCode={umlCode}
				isGenerating={isBusy}
				imageUrl={image || undefined}
				onImageGenerate={handleImageGenerate}
			/>
		)
	}

	const renderChatHistory = () => {
		if (chatHistory.length === 0) {
			return (
				<p className="text-sm text-muted-foreground">
					No messages yet. Describe a system or ask for a change to get started.
				</p>
			)
		}

		return chatHistory.map(message => {
			const label =
				message.role === 'user'
					? 'You'
					: message.role === 'assistant'
						? 'Assistant'
						: message.role === 'system'
							? 'System'
							: 'Error'
			const accentClass =
				message.role === 'user'
					? 'text-primary'
					: message.role === 'assistant'
						? 'text-emerald-500'
						: message.role === 'error'
							? 'text-destructive'
							: 'text-muted-foreground'

			return (
				<div key={message.id} className="mb-3 last:mb-0">
					<p className={`text-xs font-semibold uppercase ${accentClass}`}>{label}</p>
					<p className="text-sm whitespace-pre-wrap">{message.content}</p>
				</div>
			)
		})
	}

	const handleTemplateChange = (type: string) => {
		setDiagramType(type)
		const nextTemplate = DIAGRAM_TEMPLATES[type]
		const currentTemplate = DIAGRAM_TEMPLATES[diagramType]
		if (nextTemplate && (umlCode.trim().length === 0 || umlCode === currentTemplate)) {
			setUmlCode(nextTemplate)
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
		if (!image) {
			return
		}
		try {
			// Fetch the SVG content from the PlantUML URL
			const response = await fetch(image)
			if (!response.ok) {
				throw new Error('Failed to fetch the SVG content')
			}

			// Convert the response to a Blob
			const svgBlob = await response.blob()

			// Create a URL for the Blob
			const url = URL.createObjectURL(svgBlob)

			// Create a temporary anchor element to trigger the download
			const link = document.createElement('a')
			link.href = url
			link.download = 'uml.svg' // Set the filename for the downloaded file
			document.body.appendChild(link) // Append the link to the DOM (required for Firefox)
			link.click() // Trigger the download

			// Clean up by revoking the Blob URL and removing the link element
			URL.revokeObjectURL(url)
			document.body.removeChild(link)
		} catch (error) {
			console.error('Error downloading the SVG:', error)
		}
	}

	const handleManualUpdate = () => {
		if (!umlCode.trim()) {
			return
		}
		setErrorMsg(null)
		setIsRefreshing(true)
		setImage('')
	}

	const handleImageGenerate = useCallback((url: string) => {
		setImage(url)
		setIsRefreshing(false)
	}, [])

	const isBusy = isGenerating || isRefreshing

	return (
		<div className={`min-h-screen bg-background text-foreground`}>
			<header className="border-b">
				<div className="container mx-auto px-4 py-3 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<FileCode className="h-6 w-6 text-primary" />
						<h1 className="text-xl font-bold">Model Foundry</h1>
						<Badge variant="accent" className="ml-2 uppercase tracking-wide">
							Alpha
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
						{/* TODO: Add share and settings functionality */}
						{/* <Button variant="outline" size="sm">
							<Share2 className="h-4 w-4 mr-2" />
							Share
						</Button>

						<Button variant="outline" size="sm">
							<Settings className="h-4 w-4 mr-2" />
							Settings
						</Button> */}
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
								<li>• Select the diagram you need.</li>
								<li>• When revising, refer to existing elements</li>
								<li>• Switch templates to explore other UML diagram types.</li>
								<li>• Fine-tune the PlantUML code directly in the editor.</li>
								<li>• Refresh the page to wipe memory - save prompts elsewhere as necessary</li>
							</ul>
						</CardContent>
					</Card>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-[1.3fr_2.7fr] gap-6">
					{/* Sidebar */}
					<div>
						<Card>
							<CardContent className="p-4">
								<div className="space-y-4">
									<div>
										<h3 className="text-lg font-medium mb-2 flex items-center gap-2">
											<LayoutTemplate className="h-4 w-4 text-primary" />
											Templates
										</h3>
										<div className="space-y-2">
											<Select
												value={diagramType}
												onValueChange={handleTemplateChange}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select template" />
												</SelectTrigger>
												<SelectContent>
													{DIAGRAM_TYPES.map(type => (
														<SelectItem key={type} value={type}>
															{type} Diagram
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									</div>

									<Separator />

									<div>
										<h3 className="text-lg font-medium mb-2 flex items-center gap-2">
											<Sparkles className="h-4 w-4 text-primary" />
											UML Chat Assistant
										</h3>
										<div className="space-y-3">
											<div className="border rounded-md bg-muted/40 p-3 h-56 overflow-y-auto">
												{renderChatHistory()}
											</div>
											<Textarea
												placeholder="Ask for a diagram or request a change (Shift+Enter for new line)..."
												value={chatInput}
												onChange={e => setChatInput(e.target.value)}
												onKeyDown={event => {
													if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
														event.preventDefault()
														handleSendMessage()
													}
												}}
												className="min-h-[100px]"
											/>
											<Button
												onClick={handleSendMessage}
												className="w-full"
												disabled={isGenerating || !chatInput.trim()}
											>
												{isGenerating ? (
													<>
														<RefreshCw className="mr-2 h-4 w-4 animate-spin" />
														Working...
													</>
												) : (
													<>
														<Zap className="mr-2 h-4 w-4" />
														Send Request
													</>
												)}
											</Button>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Main content */}
					<div>
						<Tabs
							value={activeTab}
							onValueChange={setActiveTab}
							className="w-full"
						>
							<div className="flex justify-between items-center mb-4">
								<TabsList>
									<TabsTrigger
										value="editor"
										className="flex items-center gap-2"
									>
										<Code className="h-4 w-4" />
										Editor
									</TabsTrigger>
									<TabsTrigger
										value="preview"
										className="flex items-center gap-2"
									>
										<FileCode className="h-4 w-4" />
										Preview
									</TabsTrigger>
									<TabsTrigger
										value="split"
										className="flex items-center gap-2"
									>
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
									<Button onClick={handleDownload} variant="outline" size="sm">
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
											<div
												ref={editorRef}
												className="p-4 font-mono text-sm h-[500px] overflow-auto"
											>
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
											<div className="h-[500px] overflow-auto">
												{renderUML()}
											</div>
										</div>
									</CardContent>
								</Card>
							</TabsContent>

							<TabsContent value="split" className="mt-0">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
												<div className="p-4 font-mono text-sm h-[500px] overflow-auto">
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
											<div className="h-[500px] border overflow-auto">
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
