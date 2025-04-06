from setuptools import setup, find_packages

setup(
    name="kilokokua-backend",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "fastapi>=0.103.1,<1.0.0",
        "uvicorn>=0.23.2,<1.0.0",
        "pydantic>=2.4.0,<3.0.0",
        "python-dotenv>=1.0.0,<2.0.0",
        "google-cloud-aiplatform>=1.38.0",
        "python-multipart>=0.0.6,<1.0.0",
    ],
    python_requires=">=3.8,<3.14",
) 