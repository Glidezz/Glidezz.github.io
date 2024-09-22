render:
	pandoc --standalone resume.md -t html -c style.css -o resume.html
	awk '/<link rel="stylesheet" href="style.css" \/>/ {print "<style>"; system("cat style.css"); print "</style>"; next} 1' resume.html > temp
	mv temp resume.html
	pandoc --standalone resume.md -t html --pdf-engine=wkhtmltopdf -V margin-top=0.15 -V margin-left=0.15 -V margin-right=0.15 -V margin-bottom=0.15 -V papersize=letter -c style.css -o resume.pdf
	pandoc --from markdown --to docx -o resume.docx resume.md
	pandoc --standalone --from markdown --to plain -o resume.txt resume.md

html:
	pandoc --standalone resume.md -t html -c style.css -o resume.html

# html_export:
# 	pandoc --standalone resume.md -t html -c style-export.css -o resume_export.html
# 	awk '/<!DOCTYPE html>/ {print "---"; print "layout: \"layout.html\""; print "---"; print "<!DOCTYPE html>"; next} 1' resume_export.html > temp1
# 	awk '/<link rel="stylesheet" href="style-export.css" \/>/ {print "<style>"; system("cat style-export.css"); print "</style>"; next} 1' temp1 > temp2
# 	rm temp1
# 	mv temp2 resume_export.html


pdf:
	pandoc --standalone resume.md -t html --pdf-engine=wkhtmltopdf -V margin-top=0.15 -V margin-left=0.15 -V margin-right=0.15 -V margin-bottom=0.15 -V papersize=letter -c style.css -o resume.pdf

docx:
	pandoc --from markdown --to docx -o resume.docx resume.md